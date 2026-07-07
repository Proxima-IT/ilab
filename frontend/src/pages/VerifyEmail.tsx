import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Check, Loader2, Mail, RotateCw } from "lucide-react";
import { AuthLayout } from "@/components/site/AuthLayout";
import { authService } from "@/services/auth.service";
import { authStore } from "@/lib/auth";
import { applySeo } from "@/lib/seo";

function getDeviceId(): string {
  const key = "ilab.device_id";
  const existing = localStorage.getItem(key);

  if (existing) return existing;

  const generated =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  localStorage.setItem(key, generated);
  return generated;
}

function getErrorMessage(error: any): string {
  return error?.response?.data?.message || "Verification failed. Please try again.";
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: "Verify Email | iLab BD",
      description: "Verify your iLab BD student account email address with a secure one-time code.",
      path: "/verify-email",
      robots: "noindex,nofollow",
    });
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!email || otp.length !== 6) {
      setError("Enter your email and 6 digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifyEmail({
        email: email.trim().toLowerCase(),
        otp,
        device_id: getDeviceId(),
        platform: "web",
        fcm_token: null,
      });

      authStore.setSession(response.data.user, response.data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Enter your email first.");
      return;
    }

    setResending(true);

    try {
      const response = await authService.resendEmailVerification(email.trim().toLowerCase());
      setMessage(response.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We sent a 6 digit code to your email address."
      highlight={{
        eyebrow: "Almost done",
        heading: "Verify once, then start learning.",
        bullets: [
          "Keeps your account secure",
          "Protects course access",
          "Helps recover your account later",
        ],
      }}
      footer={
        <>
          Already verified?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-dark">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Field label="Email">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </Field>

        <Field label="Verification code">
          <Check className="h-4 w-4 text-muted-foreground" />
          <input
            inputMode="numeric"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="flex-1 bg-transparent text-sm tracking-[0.35em] outline-none placeholder:tracking-normal placeholder:text-muted-foreground/70"
          />
        </Field>

        {message && (
          <div className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm text-success">
            {message}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || resending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full gradient-orange py-3 text-sm font-semibold text-white shadow-orange-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {loading ? "Verifying..." : "Verify email"}
        </button>

        <button
          type="button"
          onClick={resend}
          disabled={loading || resending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-semibold text-foreground transition hover:border-primary disabled:opacity-70"
        >
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          {resending ? "Sending..." : "Resend code"}
        </button>
      </form>
    </AuthLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3 transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        {children}
      </div>
    </label>
  );
}
