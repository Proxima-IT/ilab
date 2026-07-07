import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { AuthLayout } from "@/components/site/AuthLayout";
import { authService } from "@/services/auth.service";
import { applySeo } from "@/lib/seo";

function getErrorMessage(error: any): string {
  return error?.response?.data?.message || "Could not send reset code. Please try again.";
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: "Forgot Password | iLab BD",
      description: "Request a password reset code for your iLab BD student account.",
      path: "/forgot-password",
      robots: "noindex,nofollow",
    });
  }, []);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email) {
      setError("Enter your email address.");
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword({ identifier: email.trim().toLowerCase() });
      navigate(`/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we will send a password reset code."
      highlight={{
        eyebrow: "Secure recovery",
        heading: "Get back to your courses.",
        bullets: [
          "Email-only reset code",
          "Code expires after 15 minutes",
          "Old sessions are removed after reset",
        ],
      }}
      footer={
        <>
          Remembered your password?{" "}
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {loading ? "Sending..." : "Send reset code"}
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
