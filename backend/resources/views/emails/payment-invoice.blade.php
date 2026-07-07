<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $payment->id }}</title>
</head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:28px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
                    <tr>
                        <td style="background:#0f766e;padding:28px 32px;color:#ffffff;">
                            <p style="margin:0;font-size:13px;letter-spacing:.12em;text-transform:uppercase;">{{ $appName }}</p>
                            <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;">Payment successful</h1>
                            <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#d1fae5;">Your course enrollment is confirmed. A copy of your invoice is below.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:30px 32px;">
                            <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">Hi {{ $student->name ?? 'Student' }},</p>
                            <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:#374151;">Thank you for enrolling in <strong>{{ $course->title ?? 'your course' }}</strong>. You can now access the course from your student dashboard.</p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
                                <tr>
                                    <td style="padding:12px 14px;background:#f9fafb;color:#6b7280;font-size:13px;">Invoice ID</td>
                                    <td style="padding:12px 14px;text-align:right;font-size:13px;font-weight:700;">{{ $payment->id }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 14px;color:#6b7280;font-size:13px;">Course</td>
                                    <td style="padding:12px 14px;text-align:right;font-size:13px;font-weight:700;">{{ $course->title ?? 'Course' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:12px 14px;background:#f9fafb;color:#6b7280;font-size:13px;">Payment Method</td>
                                    <td style="padding:12px 14px;background:#f9fafb;text-align:right;font-size:13px;font-weight:700;">{{ strtoupper($payment->method) }}</td>
                                </tr>
                                @if($coupon)
                                    <tr>
                                        <td style="padding:12px 14px;color:#6b7280;font-size:13px;">Coupon</td>
                                        <td style="padding:12px 14px;text-align:right;font-size:13px;font-weight:700;">{{ $coupon->code }}</td>
                                    </tr>
                                @endif
                                <tr>
                                    <td style="padding:12px 14px;background:#f9fafb;color:#6b7280;font-size:13px;">Transaction ID</td>
                                    <td style="padding:12px 14px;background:#f9fafb;text-align:right;font-size:13px;font-weight:700;">{{ $payment->transaction_id ?: 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:14px;color:#111827;font-size:15px;font-weight:700;">Amount Paid</td>
                                    <td style="padding:14px;text-align:right;color:#0f766e;font-size:18px;font-weight:800;">৳{{ number_format((float) $payment->amount, 2) }}</td>
                                </tr>
                            </table>

                            <div style="margin-top:24px;text-align:center;">
                                <a href="{{ $invoiceUrl }}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:13px 22px;border-radius:999px;font-size:14px;font-weight:700;">View invoice</a>
                            </div>

                            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b7280;">If you have any question about this invoice, contact us at {{ $supportEmail }}.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
