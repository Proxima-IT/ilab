import { useNavigate  } from "react-router-dom";
import { useState } from "react";
import { claimFirstSuperAdmin } from "@/lib/admin/bootstrap.functions";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";



export default function ClaimPage() {
  const auth = useAdminAuth();
  const navigate = useNavigate();
  const claim = claimFirstSuperAdmin;
  const [loading, setLoading] = useState(false);

  const onClaim = async () => {
    setLoading(true);
    try {
      const res = await claim();
      if (res.ok) {
        toast.success("You are now Super Admin");
        navigate("/admin");
      } else {
        toast.error("A super admin already exists. Ask them to grant you access.");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-xl font-semibold text-white">Claim Super Admin</h1>
        <p className="mt-2 text-sm text-zinc-400">
          This is a one-time action. The first signed-in user who clicks below becomes Super
          Admin. After that, only existing Super Admins can grant roles.
        </p>
        <p className="mt-3 text-xs text-zinc-500">Signed in as {auth.email ?? "…"}</p>
        <Button className="mt-6 w-full" onClick={onClaim} disabled={loading || !auth.userId}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Make me Super Admin
        </Button>
      </div>
    </div>
  );
}
