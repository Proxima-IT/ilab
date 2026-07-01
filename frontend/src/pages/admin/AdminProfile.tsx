import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Camera, Loader2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth.service";
import { authStore, type AuthUser } from "@/lib/auth";
import { imageUrl } from "@/services/course-catalog.service";

function fallbackAvatar(name?: string | null) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Admin")}&background=111827&color=ffffff`;
}

function avatarSrc(user: AuthUser | null) {
  const avatar = user?.avatar;

  if (!avatar) return fallbackAvatar(user?.name);
  return imageUrl(avatar);
}

export default function AdminProfile() {
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<"profile" | "avatar" | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      setLoading(true);

      try {
        const response = await authService.getAdminProfile();
        const user = response.data.profile;

        if (!mounted) return;

        setProfile(user);
        setName(user.name || "");
        setBio(user.bio || "");
      } catch {
        if (mounted) toast.error("Admin profile load hoyni.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setSaving("profile");

    try {
      const response = await authService.updateAdminProfile({
        name: name.trim(),
        bio: bio.trim() || null,
      });

      setProfile(response.data.profile);

      const current = authStore.getUser();
      const token = authStore.getToken();

      if (current && token) {
        authStore.setSession({ ...current, ...response.data.profile }, token);
      }

      toast.success("Admin profile updated.");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Profile update hoyni.";
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setSaving("avatar");

    try {
      const response = await authService.updateAdminAvatar(file);
      setProfile(response.data.profile);

      const current = authStore.getUser();
      const token = authStore.getToken();

      if (current && token) {
        authStore.setSession({ ...current, ...response.data.profile }, token);
      }

      toast.success("Profile picture updated.");
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Profile picture upload hoyni.";
      toast.error(message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Admin Profile</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Update your admin identity shown inside the control panel.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mx-auto h-28 w-28 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
            <img
              src={avatarSrc(profile)}
              alt={name || "Admin"}
              className="h-full w-full object-cover"
            />
          </div>
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={saving === "avatar"}
            className="mx-auto mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {saving === "avatar" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            Upload photo
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="mt-4 text-center">
            <p className="font-semibold text-white">{profile?.name}</p>
            <p className="mt-1 text-xs text-zinc-500">{profile?.email}</p>
            <span className="mt-3 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] capitalize text-primary">
              {profile?.role?.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-zinc-200">
            <UserRound className="h-4 w-4 text-primary" />
            Profile information
          </div>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="admin-name" className="text-zinc-300">
                Name
              </Label>
              <Input
                id="admin-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 border-zinc-700 bg-zinc-950 text-white"
              />
            </div>

            <div>
              <Label htmlFor="admin-bio" className="text-zinc-300">
                Bio
              </Label>
              <textarea
                id="admin-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                rows={5}
                className="mt-1 w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none transition focus:border-primary"
                placeholder="Short profile bio..."
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button type="submit" disabled={saving === "profile"}>
              {saving === "profile" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
