import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminRole = "super_admin" | "content_manager";

export type AdminAuth = {
  loading: boolean;
  userId: string | null;
  email: string | null;
  roles: AdminRole[];
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

export function useAdminAuth(): AdminAuth {
  const [state, setState] = useState<AdminAuth>({
    loading: true,
    userId: null,
    email: null,
    roles: [],
    isAdmin: false,
    isSuperAdmin: false,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) {
        if (!cancelled) setState({ loading: false, userId: null, email: null, roles: [], isAdmin: false, isSuperAdmin: false });
        return;
      }
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = ((rolesData ?? []) as { role: AdminRole }[]).map((r) => r.role);
      if (cancelled) return;
      setState({
        loading: false,
        userId: user.id,
        email: user.email ?? null,
        roles,
        isAdmin: roles.includes("super_admin") || roles.includes("content_manager"),
        isSuperAdmin: roles.includes("super_admin"),
      });
    };
    void load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
