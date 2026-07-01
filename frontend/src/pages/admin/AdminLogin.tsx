import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteLogo } from "@/components/site/SiteLogo";
import { applyPrivateSeo } from "@/lib/seo";
import { authStore, useAuth } from "@/lib/auth";
import { isStaffRole, useAdminAuth } from "@/lib/admin/useAdminAuth";

function errorMessage(error: unknown): string {
  const response = error as {
    response?: {
      data?: {
        message?: string;
        errors?: {
          login?: string[];
          password?: string[];
        };
      };
    };
  };

  return (
    response.response?.data?.errors?.login?.[0] ||
    response.response?.data?.errors?.password?.[0] ||
    response.response?.data?.message ||
    (error instanceof Error ? error.message : "") ||
    "Login failed. Please check your credentials."
  );
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const auth = useAuth();
  const adminAuth = useAdminAuth();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    applyPrivateSeo({
      title: "Admin Login - iLab BD",
      description: "Secure staff login for the iLab BD admin panel.",
      path: "/admin/login",
    });
  }, []);

  if (adminAuth.loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-zinc-950 text-zinc-300">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (adminAuth.isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!login.trim() || !password) {
      setError("Email/phone and password are required.");
      return;
    }

    setLoading(true);

    try {
      const response = await authStore.login({
        login: login.trim(),
        password,
        portal: "admin",
      });

      if (!isStaffRole(response.data.user.role)) {
        await authStore.logout();
        throw new Error("Only admin, manager, instructor, or super admin accounts can access this panel.");
      }

      toast.success("Admin login successful.");
      navigate("/admin", { replace: true });
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const loggedInAsStudent = auth.isAuthenticated && auth.user?.role === "student";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Main site
          </Link>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
            Staff only
          </span>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/30">
          <div className="mb-6 flex items-start gap-3">
            <SiteLogo size="sm" />
            <div>
              <h1 className="text-xl font-semibold text-white">iLab Admin</h1>
              <p className="mt-1 text-xs leading-5 text-zinc-400">
                Secure login for super admin, admin, manager, and instructor accounts.
              </p>
            </div>
          </div>

          {loggedInAsStudent && (
            <div className="mb-4 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3 text-xs leading-5 text-amber-100">
              You are currently logged in as a student. Staff credentials are required for the admin panel.
            </div>
          )}

          {error && (
            <div className="mb-4 flex gap-2 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-xs leading-5 text-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="admin-login" className="text-zinc-300">
                Email or phone
              </Label>
              <Input
                id="admin-login"
                type="text"
                autoComplete="username"
                required
                value={login}
                onChange={(event) => setLogin(event.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-600"
                placeholder="admin@ilabbd.com"
              />
            </div>

            <div>
              <Label htmlFor="admin-password" className="text-zinc-300">
                Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white placeholder:text-zinc-600"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LockKeyhole className="mr-2 h-4 w-4" />
              )}
              Login to Admin
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
