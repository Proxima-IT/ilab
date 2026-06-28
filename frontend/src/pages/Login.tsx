import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/site/AuthLayout";
import { authStore } from "@/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || undefined;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Log in — iLab BD";
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    authStore.login({
      id: "demo-user",
      name: email.split("@")[0] || "Learner",
      email,
    });
    setLoading(false);
    if (redirect) {
      window.location.href = redirect;
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue your learning journey."
      highlight={{
        eyebrow: "Join 25,000+ learners",
        heading: "Build a future-ready career with iLab.",
        bullets: [
          "Live mentors from top tech companies",
          "Hands-on, project-based curriculum",
          "Job assistance and interview prep",
        ],
      }}
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:text-primary-dark">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <SocialButtons />
        <Divider />

        <Field label="Email">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
        </Field>

        <Field label="Password">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <input
            type={showPw ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="text-muted-foreground hover:text-foreground"
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </Field>

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-[var(--primary)]"
            />
            Remember me
          </label>
          <a href="#forgot" className="font-medium text-primary hover:text-primary-dark">
            Forgot password?
          </a>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full gradient-orange text-white py-3 text-sm font-semibold shadow-orange-glow hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-70"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthLayout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition">
        {children}
      </div>
    </label>
  );
}

function Divider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
      <div className="relative flex justify-center"><span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">or continue with email</span></div>
    </div>
  );
}

function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium hover:bg-surface transition">
        <GoogleIcon /> Google
      </button>
      <button type="button" className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-sm font-medium hover:bg-surface transition">
        <AppleIcon /> Apple
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.67-2.26 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/>
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.95l3.66-2.84Z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill="currentColor">
      <path d="M16.37 12.74c0-2.7 2.2-3.99 2.3-4.05-1.25-1.83-3.2-2.08-3.89-2.11-1.66-.17-3.24.97-4.08.97-.85 0-2.15-.95-3.54-.92-1.82.03-3.5 1.06-4.44 2.69-1.9 3.29-.48 8.16 1.36 10.83.9 1.31 1.97 2.78 3.37 2.73 1.36-.05 1.87-.88 3.51-.88s2.1.88 3.54.85c1.46-.03 2.39-1.33 3.28-2.65 1.04-1.52 1.47-3 1.49-3.07-.03-.02-2.86-1.1-2.9-4.39Zm-2.66-8.04c.75-.91 1.25-2.17 1.11-3.43-1.07.04-2.37.71-3.14 1.61-.69.8-1.3 2.09-1.14 3.32 1.2.09 2.42-.61 3.17-1.5Z"/>
    </svg>
  );
}
