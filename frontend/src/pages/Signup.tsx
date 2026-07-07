import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check, Smartphone } from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { AuthLayout } from "@/components/site/AuthLayout";
import { authService } from "@/services/auth.service";
import { authStore, useAuth, type AuthUser } from "@/lib/auth";
import { api } from "@/lib/api";
import { applySeo } from "@/lib/seo";

type ApiLoginResponse = {
  success: boolean;
  data: {
    user: AuthUser;
    token: string;
    token_type?: string;
    profile_completed?: boolean;
    phone_verification_required?: boolean;
    email_verification_required?: boolean;
  };
  message: string;
  errors: unknown;
};

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
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.email_or_phone?.[0] ||
    error?.response?.data?.errors?.email?.[0] ||
    "Registration failed. Please check your information and try again."
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: "Create Account | iLab BD",
      description: "Create your iLab BD student account to enroll in courses, track progress, ask questions, and receive certificates.",
      path: "/signup",
      robots: "noindex,nofollow",
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
  }, [isAuthenticated, isAdmin, navigate]);

  const strength = useMemo(() => scorePassword(password), [password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password || !passwordConfirmation) {
      setError("Please fill in your name, email, and password.");
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
    if (!agree) {
      setError("Please accept the terms to continue.");
      return;
    }
    setLoading(true);

    try {
      await authService.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        password,
        password_confirmation: passwordConfirmation,
        device_id: getDeviceId(),
        platform: "web",
        fcm_token: null,
      });

      navigate(`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(null);

    if (!credentialResponse.credential) {
      setError("Google signup failed. Please try again.");
      return;
    }

    setGoogleLoading(true);

    try {
      const response = await api.post<ApiLoginResponse>("/auth/google", {
        id_token: credentialResponse.credential,
        portal: "student",
        device_id: getDeviceId(),
        platform: "web",
        fcm_token: null,
      });

      authStore.setSession(response.data.data.user, response.data.data.token);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start learning with mentors from top tech companies."
      highlight={{
        eyebrow: "Limited seats — Cohort 2026",
        heading: "Industry-grade courses, built for outcomes.",
        bullets: [
          "Live classes + lifetime recordings",
          "Real-world capstone projects",
          "1:1 mentor reviews every week",
        ],
      }}
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-dark">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="rounded-xl border border-border bg-card p-2">
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => setError("Google signup failed. Please try again.")}
            width="100%"
          />
        </div>

        {googleLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing up with Google...
          </div>
        )}

        <Divider />

        <Field label="Full name">
          <User className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
        </Field>

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

        <Field label="Phone (optional)">
          <Smartphone className="h-4 w-4 text-muted-foreground" />
          <input
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01700000000"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
        </Field>

        <div>
          <Field label="Password">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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
          {password && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full transition-all ${strength.color}`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
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
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Repeat your password"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/70"
          />
        </Field>

        <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--primary)]"
          />
          <span>
            I agree to iLab's{" "}
            <Link to="/terms" className="text-primary hover:text-primary-dark font-medium">Terms</Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:text-primary-dark font-medium">Privacy Policy</Link>.
          </span>
        </label>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full gradient-orange text-white py-3 text-sm font-semibold shadow-orange-glow hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {loading ? "Creating account..." : "Create account"}
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
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-background px-3 text-xs uppercase tracking-wider text-muted-foreground">
          or create with email
        </span>
      </div>
    </div>
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
