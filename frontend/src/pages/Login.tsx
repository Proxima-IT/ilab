import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, Loader2 } from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { AuthLayout } from "@/components/site/AuthLayout";
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
    error?.response?.data?.errors?.login?.[0] ||
    "Login failed. Please check your information and try again."
  );
}

function getVerificationEmail(error: any): string | null {
  return error?.response?.data?.data?.email || null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isAdmin } = useAuth();
  const redirect = searchParams.get("redirect") || undefined;

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    applySeo({
      title: "Log in | iLab BD",
      description: "Log in to your iLab BD student account to access enrolled courses, progress, notes, certificates, and notifications.",
      path: "/login",
      robots: "noindex,nofollow",
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
  }, [isAuthenticated, isAdmin, navigate]);

  const afterLogin = () => {
    if (redirect) {
      window.location.href = redirect;
      return;
    }

    navigate("/dashboard");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!login || !password) {
      setError("Please enter your phone/email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await authStore.login({
        login,
        password,
        portal: "student",
        device_id: getDeviceId(),
        platform: "web",
        fcm_token: null,
      });

      if (response.success) {
        afterLogin();
      }
    } catch (err) {
      const verificationEmail = getVerificationEmail(err);

      if (verificationEmail) {
        navigate(`/verify-email?email=${encodeURIComponent(verificationEmail)}`);
        return;
      }

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    setError(null);

    if (!credentialResponse.credential) {
      setError("Google login failed. Please try again.");
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
      afterLogin();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in with your email or Google account."
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
        <div className="flex justify-center [&>div]:mx-auto [&_iframe]:mx-auto">
          <GoogleLogin
            onSuccess={onGoogleSuccess}
            onError={() => setError("Google login failed. Please try again.")}
            width="320"
            logo_alignment="center"
          />
        </div>

        {googleLoading && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in with Google...
          </div>
        )}

        <Divider />

        <Field label="Email">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
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

          <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-dark">
            Forgot password?
          </Link>
        </div>

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
      <span className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </span>
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
          or continue with email
        </span>
      </div>
    </div>
  );
}
