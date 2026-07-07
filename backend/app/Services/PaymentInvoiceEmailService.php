<?php

namespace App\Services;

use App\Models\Payment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PaymentInvoiceEmailService
{
    public function sendIfNeeded(Payment $payment): void
    {
        try {
            $reservedPayment = $this->reserveInvoiceEmail($payment);

            if (! $reservedPayment || empty($reservedPayment->user?->email)) {
                return;
            }

            Mail::html(
                view('emails.payment-invoice', [
                    'appName' => config('app.name', 'iLab'),
                    'payment' => $reservedPayment,
                    'student' => $reservedPayment->user,
                    'course' => $reservedPayment->course,
                    'coupon' => $reservedPayment->coupon,
                    'invoiceUrl' => $this->invoiceUrl($reservedPayment),
                    'supportEmail' => config('mail.from.address'),
                ])->render(),
                function ($message) use ($reservedPayment) {
                    $message
                        ->to($reservedPayment->user->email, $reservedPayment->user->name)
                        ->subject('Your iLab course invoice #' . $reservedPayment->id);
                }
            );

            $this->markInvoiceEmailSent($reservedPayment);
        } catch (\Throwable $e) {
            Log::error('Payment invoice email failed: ' . $e->getMessage(), [
                'payment_id' => $payment->id,
            ]);

            $this->markInvoiceEmailFailed($payment, $e->getMessage());
        }
    }

    private function reserveInvoiceEmail(Payment $payment): ?Payment
    {
        return DB::transaction(function () use ($payment) {
            $lockedPayment = Payment::with(['user', 'course', 'coupon'])
                ->whereKey($payment->id)
                ->lockForUpdate()
                ->first();

            if (! $lockedPayment || $lockedPayment->status !== 'completed') {
                return null;
            }

            $gatewayResponse = $lockedPayment->gateway_response ?? [];

            if (! empty($gatewayResponse['invoice_email_sent_at'])) {
                return null;
            }

            if (! empty($gatewayResponse['invoice_email_sending_at'])) {
                $reservedAt = Carbon::parse($gatewayResponse['invoice_email_sending_at']);

                if ($reservedAt->gt(now()->subMinutes(5))) {
                    return null;
                }
            }

            $gatewayResponse['invoice_email_sending_at'] = now()->toISOString();
            unset($gatewayResponse['invoice_email_failed_at'], $gatewayResponse['invoice_email_error']);

            $lockedPayment->forceFill([
                'gateway_response' => $gatewayResponse,
            ])->save();

            return $lockedPayment->fresh(['user', 'course', 'coupon']);
        }, 5);
    }

    private function markInvoiceEmailSent(Payment $payment): void
    {
        DB::transaction(function () use ($payment) {
            $lockedPayment = Payment::whereKey($payment->id)->lockForUpdate()->first();

            if (! $lockedPayment) {
                return;
            }

            $gatewayResponse = $lockedPayment->gateway_response ?? [];
            $gatewayResponse['invoice_email_sent_at'] = now()->toISOString();
            unset(
                $gatewayResponse['invoice_email_sending_at'],
                $gatewayResponse['invoice_email_failed_at'],
                $gatewayResponse['invoice_email_error']
            );

            $lockedPayment->forceFill([
                'gateway_response' => $gatewayResponse,
            ])->save();
        }, 5);
    }

    private function markInvoiceEmailFailed(Payment $payment, string $error): void
    {
        DB::transaction(function () use ($payment, $error) {
            $lockedPayment = Payment::whereKey($payment->id)->lockForUpdate()->first();

            if (! $lockedPayment) {
                return;
            }

            $gatewayResponse = $lockedPayment->gateway_response ?? [];
            $gatewayResponse['invoice_email_failed_at'] = now()->toISOString();
            $gatewayResponse['invoice_email_error'] = mb_substr($error, 0, 500);
            unset($gatewayResponse['invoice_email_sending_at']);

            $lockedPayment->forceFill([
                'gateway_response' => $gatewayResponse,
            ])->save();
        }, 5);
    }

    private function invoiceUrl(Payment $payment): string
    {
        return rtrim((string) config('app.frontend_url'), '/') . '/enroll/success?invoice_id=' . urlencode((string) $payment->id);
    }
}
