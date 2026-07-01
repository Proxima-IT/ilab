import { useEffect, useMemo, useState } from "react";
import { authService } from "@/services/auth.service";
import { useAuth, type AuthUser, type UserRole } from "@/lib/auth";

export type AdminRole = Exclude<UserRole, "student">;

export type AdminAuth = {
  loading: boolean;
  userId: number | null;
  email: string | null;
  name: string | null;
  role: AdminRole | null;
  profile: AuthUser | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
};

const STAFF_ROLES: AdminRole[] = [
  "super_admin",
  "admin",
  "manager",
  "instructor",
  "content_manager",
];

export function isStaffRole(role?: UserRole | null): role is AdminRole {
  return Boolean(role && STAFF_ROLES.includes(role as AdminRole));
}

export function useAdminAuth(): AdminAuth {
  const { user, token, clearSession } = useAuth();
  const [loading, setLoading] = useState(Boolean(token));
  const [profile, setProfile] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!token || !user || !isStaffRole(user.role)) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    authService
      .getAdminProfile()
      .then((response) => {
        if (cancelled) return;
        setProfile(response.data.profile);
      })
      .catch(() => {
        if (cancelled) return;
        setProfile(null);
        clearSession();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession, token, user]);

  return useMemo(() => {
    const activeUser = profile ?? (isStaffRole(user?.role) ? user : null);
    const role = isStaffRole(activeUser?.role) ? activeUser.role : null;

    return {
      loading,
      userId: activeUser?.id ?? null,
      email: activeUser?.email ?? null,
      name: activeUser?.name ?? null,
      role,
      profile: activeUser,
      isAdmin: Boolean(role),
      isSuperAdmin: role === "super_admin",
    };
  }, [loading, profile, user]);
}
