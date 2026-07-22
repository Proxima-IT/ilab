import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  Bell,
  BookOpen,
  Camera,
  CheckCircle2,
  Flame,
  Gift,
  Loader2,
  Mail,
  Save,
  Shield,
  Smartphone,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useStudent } from "@/hooks/useStudentData";
import { useAuth } from "@/lib/auth";
import { applyFallbackAvatar, avatarUrl } from "@/lib/avatar";
import {
  studentProfileService,
  type StudentProfileUser,
} from "@/services/student/profile.service";
import {
  notificationService,
  type StudentNotificationSettings,
} from "@/services/student/notification.service";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const settingsTabs = ["personalInfo", "password", "notifications"] as const;

type SettingsTab = (typeof settingsTabs)[number];

type FormState = {
  name: string;
  email: string;
  phone: string;
  district: string;
  education_level: string;
  bio: string;
};

type PasswordState = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

const defaultNotifications: StudentNotificationSettings = {
  new_lecture: true,
  special_offer: true,
  event: true,
  profile_update: true,
  course_completion: true,
  certificate_ready: true,
  admin_message: true,
  qna_answer: true,
  email: true,
  sms: false,
  push: true,
};

function resolveAvatar(user?: StudentProfileUser | null): string {
  return avatarUrl(user?.avatar, user?.name || "Student");
}

function unauthorized(status?: number): boolean {
  return status === 401 || status === 403;
}

function errorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string }; status?: number } }).response;
  return response?.data?.message || fallback;
}

function safeRedirect(value: string | null): string | null {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function Toggle({
  on,
  onToggle,
  disabled,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        on ? "bg-primary" : "bg-secondary"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      aria-pressed={on}
    >
      <motion.span
        className="absolute top-1 h-4 w-4 rounded-full bg-foreground shadow"
        animate={{ left: on ? 24 : 4 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-52 animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="h-80 animate-pulse rounded-2xl border border-border/30 bg-card" />
        <div className="h-80 animate-pulse rounded-2xl border border-border/30 bg-card lg:col-span-2" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const reason = searchParams.get("reason");
  const { user, token, clearSession } = useAuth();
  const {
    student,
    profileUser: sharedProfileUser,
    enrolledCoursesList,
    loading,
    refetch,
  } = useStudent();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<SettingsTab>("personalInfo");
  const [profileUser, setProfileUser] = useState<StudentProfileUser | null>(
    (user as StudentProfileUser | null) ?? null
  );
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    district: "",
    education_level: "",
    bio: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordState>({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [notifs, setNotifs] =
    useState<StudentNotificationSettings>(defaultNotifications);
  const [saving, setSaving] = useState<"profile" | "password" | "notifications" | "avatar" | null>(null);

  const applyProfile = (nextUser: StudentProfileUser) => {
    setProfileUser(nextUser);
    setForm({
      name: nextUser.name || "",
      email: nextUser.email || "",
      phone: nextUser.phone || "",
      district: nextUser.district || "",
      education_level: nextUser.education_level || "",
      bio: nextUser.bio || "",
    });
  };

  useEffect(() => {
    if (!token) {
      clearSession();
      navigate("/login", { replace: true });
      return;
    }

    if (sharedProfileUser) {
      applyProfile(sharedProfileUser);
    }
  }, [sharedProfileUser, token, navigate, clearSession]);

  useEffect(() => {
    let mounted = true;

    async function loadNotificationSettings() {
      try {
        const settings = await notificationService.getSettings();
        if (mounted) setNotifs({ ...defaultNotifications, ...settings });
      } catch {
        if (mounted) setNotifs(defaultNotifications);
      }
    }

    void loadNotificationSettings();

    return () => {
      mounted = false;
    };
  }, []);

  const completedCourses = enrolledCoursesList.filter((course) => course.progress === 100).length;
  const certificatesEarned = completedCourses;
  const displayName = profileUser?.name || student?.name || "Student";
  const displayEmail = profileUser?.email || student?.email || "";
  const avatar = resolveAvatar(profileUser);

  const profileStats = useMemo(
    () => [
      { icon: BookOpen, label: `${student?.enrolledCourses ?? 0} Courses Enrolled` },
      { icon: CheckCircle2, label: `${completedCourses} Course Complete` },
      { icon: Award, label: `${certificatesEarned} ${t("certificatesEarned")}` },
      { icon: Flame, label: `${student?.streak ?? 0} ${t("streak")}` },
      { icon: Star, label: `${t("level")} ${student?.level ?? 1}` },
    ],
    [certificatesEarned, completedCourses, student, t]
  );

  const handleUnauthorizedError = (error: unknown) => {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (unauthorized(status)) {
      clearSession();
      navigate("/login", { replace: true });
      return true;
    }

    return false;
  };

  const handleSaveProfile = async () => {
    setSaving("profile");

    try {
      const response = await studentProfileService.updateProfile({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        district: form.district.trim() || null,
        education_level: form.education_level.trim() || null,
        bio: form.bio.trim() || null,
      });

      applyProfile(response.data.user);
      await refetch();
      toast.success("Profile updated successfully.");

      if (redirect) {
        if (response.data.profile_completed) {
          navigate(redirect, { replace: true });
          return;
        }

        toast.info("Please add your phone, district, and education level before continuing.");
      }
    } catch (error) {
      if (!handleUnauthorizedError(error)) {
        toast.error(errorMessage(error, "Profile update hoyni."));
      }
    } finally {
      setSaving(null);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setSaving("avatar");

    try {
      const response = await studentProfileService.updateAvatar(file);
      applyProfile(response.data.user);
      await refetch();
      toast.success("Avatar updated successfully.");
    } catch (error) {
      if (!handleUnauthorizedError(error)) {
        toast.error(errorMessage(error, "Avatar upload hoyni."));
      }
    } finally {
      setSaving(null);
    }
  };

  const handleSavePassword = async () => {
    setSaving("password");

    try {
      const response = await studentProfileService.updatePassword(passwordForm);
      applyProfile(response.data.user);
      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
      toast.success("Password updated successfully.");
    } catch (error) {
      if (!handleUnauthorizedError(error)) {
        toast.error(errorMessage(error, "Password update hoyni."));
      }
    } finally {
      setSaving(null);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving("notifications");

    try {
      await notificationService.updateSettings(notifs);
      toast.success("Notification settings saved.");
    } catch (error) {
      if (!handleUnauthorizedError(error)) {
        toast.error(errorMessage(error, "Notification settings save hoyni."));
      }
    } finally {
      setSaving(null);
    }
  };

  if (loading || !profileUser) {
    return <ProfileSkeleton />;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="font-display text-xl text-foreground">{t("profileSettings")}</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Your account data is loaded from the iLab database.
        </p>
      </div>

      {reason === "free-course" && (
        <motion.div
          variants={item}
          className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-foreground"
        >
          <p className="font-semibold">Complete your profile to enroll in the free course.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add your phone, district, and education level. After saving, you will return to the enroll page automatically.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div variants={item} className="glass-card p-6 text-center">
          <div className="relative mb-4 inline-block">
            <div className="mx-auto h-24 w-24 overflow-hidden rounded-full ring-4 ring-primary/30">
              <img
                src={avatar}
                alt={displayName}
                className="h-full w-full object-cover"
                onError={(event) => applyFallbackAvatar(event, displayName)}
              />
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              disabled={saving === "avatar"}
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg disabled:opacity-70"
              aria-label="Update avatar"
            >
              {saving === "avatar" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <h3 className="font-ui text-lg font-semibold text-foreground">{displayName}</h3>
          {displayEmail && <p className="font-ui text-xs text-muted-foreground">{displayEmail}</p>}
          {profileUser.district && (
            <p className="font-ui text-xs text-muted-foreground">{profileUser.district}</p>
          )}

          <div className="mt-6 space-y-2 text-left">
            {profileStats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 py-1 font-ui text-xs text-muted-foreground">
                <stat.icon className="h-4 w-4 text-primary/70" />
                {stat.label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="glass-card p-5 lg:col-span-2">
          <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border/30">
            {settingsTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative whitespace-nowrap px-3 py-2 font-ui text-xs transition-colors ${
                  activeTab === tab
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(tab)}
                {activeTab === tab && (
                  <motion.div
                    layoutId="settingsTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                  />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {activeTab === "personalInfo" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      { label: t("fullName"), key: "name" as const },
                      { label: t("email"), key: "email" as const, type: "email" },
                      { label: t("phone"), key: "phone" as const },
                      { label: "District", key: "district" as const },
                      { label: "Education Level", key: "education_level" as const },
                    ].map((field) => (
                      <label key={field.key} className="block">
                        <span className="mb-1 block font-ui text-[11px] text-muted-foreground">
                          {field.label}
                        </span>
                        <input
                          type={field.type || "text"}
                          value={form[field.key]}
                          onChange={(event) =>
                            setForm({ ...form, [field.key]: event.target.value })
                          }
                          className="glass-input w-full px-3 py-2 font-ui text-xs"
                        />
                      </label>
                    ))}
                  </div>

                  <label className="block">
                    <span className="mb-1 block font-ui text-[11px] text-muted-foreground">
                      Bio
                    </span>
                    <textarea
                      value={form.bio}
                      onChange={(event) => setForm({ ...form, bio: event.target.value })}
                      rows={4}
                      className="glass-input w-full resize-none px-3 py-2 font-ui text-xs"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={saving === "profile"}
                    className="glass-button inline-flex items-center gap-1.5 px-6 py-2.5 text-xs disabled:opacity-70"
                  >
                    {saving === "profile" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    {saving === "profile" ? "Saving..." : t("save")}
                  </button>
                </div>
              )}

              {activeTab === "password" && (
                <div className="space-y-4">
                  {[
                    { label: "Current Password", key: "current_password" as const },
                    { label: "New Password", key: "password" as const },
                    { label: "Confirm Password", key: "password_confirmation" as const },
                  ].map((field) => (
                    <label key={field.key} className="block">
                      <span className="mb-1 block font-ui text-[11px] text-muted-foreground">
                        {field.label}
                      </span>
                      <input
                        type="password"
                        value={passwordForm[field.key]}
                        onChange={(event) =>
                          setPasswordForm({
                            ...passwordForm,
                            [field.key]: event.target.value,
                          })
                        }
                        className="glass-input w-full px-3 py-2 font-ui text-xs"
                      />
                    </label>
                  ))}

                  <div className="flex items-start gap-2 rounded-lg border border-border/30 bg-secondary/20 p-3 text-xs text-muted-foreground">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary/70" />
                    Use at least 8 characters. Password update will only work with your current password.
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePassword}
                    disabled={saving === "password"}
                    className="glass-button inline-flex items-center gap-1.5 px-6 py-2.5 text-xs disabled:opacity-70"
                  >
                    {saving === "password" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    {saving === "password" ? "Saving..." : t("save")}
                  </button>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-4">
                  {[
                    { key: "new_lecture" as const, icon: Bell, label: "New lecture added" },
                    { key: "special_offer" as const, icon: Gift, label: "Special offers" },
                    { key: "event" as const, icon: Bell, label: "Events" },
                    { key: "profile_update" as const, icon: Mail, label: "Profile updates" },
                    { key: "course_completion" as const, icon: CheckCircle2, label: "Course completion" },
                    { key: "certificate_ready" as const, icon: Award, label: "Certificate ready" },
                    { key: "email" as const, icon: Mail, label: "Email notifications" },
                    { key: "sms" as const, icon: Smartphone, label: "SMS notifications" },
                    { key: "push" as const, icon: Bell, label: "Push notifications" },
                  ].map((notification) => (
                    <div
                      key={notification.key}
                      className="flex items-center justify-between gap-4 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <notification.icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-ui text-xs text-foreground">
                          {notification.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Toggle
                          on={notifs[notification.key]}
                          disabled={saving === "notifications"}
                          onToggle={() =>
                            setNotifs({
                              ...notifs,
                              [notification.key]: !notifs[notification.key],
                            })
                          }
                        />
                        <span className="w-8 font-ui text-[10px] text-muted-foreground">
                          {notifs[notification.key] ? t("on") : t("off")}
                        </span>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleSaveNotifications}
                    disabled={saving === "notifications"}
                    className="glass-button inline-flex items-center gap-1.5 px-6 py-2.5 text-xs disabled:opacity-70"
                  >
                    {saving === "notifications" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    {saving === "notifications" ? "Saving..." : t("save")}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
