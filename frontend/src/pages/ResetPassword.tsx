import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Check, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { AuthLayout } from "@/components/site/AuthLayout";
import { authService } from "@/services/auth.service";
import { applySeo } from "@/lib/seo";

function getErrorMessage(error: any): string {
  return error?.response?.data?.message || "Password reset failed. Please try again.";
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => scorePassword(password), [password]);

  useEffect(() => {
    applySeo({
      title: "Set New Password | iLab BD",
      description: "Set a new password for your iLab BD student account using your email reset code.",
      path: "/reset-password",
      robots: "noindex,nofollow",
    });
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || otp.length !== 6 || !password || !passwordConfirmation) {
      setError("Enter your email, reset code, and new password.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Password confirmation does not match.");
      return;
    }

    if (strength.score < 4) {
      setError("Password must be at least 8 characters and include letters, numbers, and a symbol.");
      return;
    }

    setLoading(true);

    try {
      await authService.resetPassword({
        identifier: email.trim().toLowerCase(),
        otp,
        password,
        password_confirmation: passwordConfirmation,
      });

      navigate("/login", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Use the reset code from your email."
      highlight={{
        eyebrow: "Account recovery",
        heading: "Choose a strong new password.",
        bullets: [
          "Use letters, numbers, and symbols",
          "Reset code expires soon",
          "Log in again after changing password",
        ],
      }}
      footer={
        <>
          Need a new code?{" "}
          <Link to="/forgot-password" className="font-semibold text-primary hover:text-primary-dark">
            Send again
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

        <Field label="Reset code">
          <Check className="h-4 w-4 text-muted-foreground" />
          <input
            inputMode="numeric"
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="flex-1 bg-transparent text-sm tracking-[0.35em] outline-none placeholder:tracking-normal placeholder:text-muted-foreground/70"
          />
        </Field>

        <div>
          <Field label="New password">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="button"
              onClick={() => setShowPw((current) => !current)}
              className="text-muted-foreground hover:text-foreground"
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </Field>
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div className={`h-full transition-all ${strength.color}`} style={{ width: `${(strength.score / 4) * 100}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{strength.label}</span>
            </div>
          )}
        </div>

        <Field label="Confirm password">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <input
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            placeholder="Repeat your password"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
          />
        </Field>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full gradient-orange py-3 text-sm font-semibold text-white shadow-orange-glow transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {loading ? "Changing..." : "Change password"}
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

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Za-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const map = [
    { label: "Too weak", color: "bg-destructive" },
    { label: "Weak", color: "bg-destructive" },
    { label: "Fair", color: "bg-warning" },
    { label: "Good", color: "bg-primary" },
    { label: "Strong", color: "bg-success" },
  ];
  return { score, ...map[score] };
}
