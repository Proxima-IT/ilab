import { supabase } from "@/integrations/supabase/client";

// Promotes the calling user to super_admin if no super_admin exists yet.
// One-shot bootstrap for the very first owner of the site.
export async function claimFirstSuperAdmin() {
  const { count, error: countErr } = await supabase
    .from("user_roles")
    .select("*", { count: "exact", head: true });
  if (countErr) throw new Error(countErr.message);
  
  if ((count ?? 0) > 0) {
    return { ok: false, reason: "already_claimed" as const };
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("user_roles")
    .insert({ user_id: user.id, role: "super_admin" });
  if (error) throw new Error(error.message);
  
  return { ok: true as const };
}

// Lists users (profiles joined with roles) for the Users admin page
export async function listUsers() {
  const { data: profiles, error: profError } = await supabase
    .from("profiles")
    .select("id, email, full_name, created_at");
  if (profError) throw new Error(profError.message);

  const { data: rolesAll, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id, role");
  if (rolesError) throw new Error(rolesError.message);

  return profiles.map((p) => ({
    id: p.id,
    email: p.email,
    created_at: p.created_at,
    last_sign_in_at: null,
    full_name: p.full_name,
    roles: (rolesAll ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
  }));
}

export async function setUserRole(data: { userId: string; role: "super_admin" | "content_manager"; enabled: boolean }) {
  if (data.enabled) {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
  }
  return { ok: true };
}
