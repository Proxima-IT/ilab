import { Link, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Check } from "lucide-react";
import { AuthLayout } from "@/components/site/AuthLayout";
import { authStore } from "@/lib/auth";

export default function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Create your account — iLab BD";
  }, []);

  const strength = useMemo(() => scorePassword(password), [password]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!agree) {
      setError("Please accept the terms to continue.");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    authStore.login({ id: "demo-user", name, email });
    setLoading(false);
    navigate("/dashboard");
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

        <label className="flex items-start gap-2 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-[var(--primary)]"
          />
          <span>
            I agree to iLab's{" "}
            <a href="#terms" className="text-primary hover:text-primary-dark font-medium">Terms</a>{" "}
            and{" "}
            <a href="#privacy" className="text-primary hover:text-primary-dark font-medium">Privacy Policy</a>.
          </span>
        </label>

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

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
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
