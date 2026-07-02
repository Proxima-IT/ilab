import { useEffect, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CreditCard,
  Globe2,
  Loader2,
  Mail,
  Phone,
  Save,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/lib/admin/useAdminAuth";
import {
  adminSystemSettingsService,
  type PaymentEnvironment,
  type SystemSettings,
} from "@/services/admin/system-settings.service";

const defaultSettings: SystemSettings = {
  general: {
    website_name: "iLab BD",
    support_email: "support@ilabbd.com",
    support_phone: "+880 1700-000000",
    currency_code: "BDT",
    currency_symbol: "৳",
  },
  payments: {
    uddoktapay_enabled: true,
    free_enrollment_enabled: true,
    manual_payment_enabled: false,
    sandbox_mode: false,
    payment_support_text: "For payment support, contact our support team.",
    manual_payment_instructions: "",
  },
  maintenance: {
    enabled: false,
    title: "We are improving iLab BD",
    message: "The platform is temporarily under maintenance. Please check back soon.",
    allowed_ips: [],
  },
};

const defaultEnvironment: PaymentEnvironment = {
  uddoktapay_api_url_configured: false,
  uddoktapay_api_key_configured: false,
};

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

export default function AdminSystemSettings() {
  const auth = useAdminAuth();
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [environment, setEnvironment] = useState<PaymentEnvironment>(defaultEnvironment);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowedIpText, setAllowedIpText] = useState("");

  const canManage = auth.role === "super_admin" || auth.role === "admin";

  useEffect(() => {
    let mounted = true;

    if (!canManage) {
      setLoading(false);
      return;
    }

    adminSystemSettingsService
      .get()
      .then((data) => {
        if (!mounted) return;
        setSettings(data.settings);
        setEnvironment(data.payment_environment);
        setAllowedIpText(data.settings.maintenance.allowed_ips.join("\n"));
      })
      .catch((error) => {
        if (mounted) toast.error(firstError(error, "System settings load hoyni."));
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [canManage]);

  const updateSection = <K extends keyof SystemSettings>(section: K, value: Partial<SystemSettings[K]>) => {
    setSettings((current) => ({
      ...current,
      [section]: {
        ...current[section],
        ...value,
      },
    }));
  };

  const save = async () => {
    setSaving(true);

    try {
      const payload: SystemSettings = {
        ...settings,
        maintenance: {
          ...settings.maintenance,
          allowed_ips: allowedIpText
            .split("\n")
            .map((ip) => ip.trim())
            .filter(Boolean),
        },
      };

      const data = await adminSystemSettingsService.update(payload);
      setSettings(data.settings);
      setEnvironment(data.payment_environment);
      setAllowedIpText(data.settings.maintenance.allowed_ips.join("\n"));
      toast.success("System settings saved.");
    } catch (error) {
      toast.error(firstError(error, "System settings save hoyni."));
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
        <h1 className="text-xl font-semibold text-white">Admin access required</h1>
        <p className="mt-2 text-sm text-zinc-400">
          System settings can only be managed by Super Admin and Admin accounts.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20 text-zinc-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">System Settings</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Control site identity, support contact, currency, payments, and maintenance mode.
          </p>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>

      <div className="space-y-6">
        <Section
          title="General"
          description="Basic website identity and support contact details."
          icon={<Globe2 className="h-4 w-4" />}
        >
          <Field label="Website name" icon={<Settings className="h-3.5 w-3.5" />}>
            <Input
              value={settings.general.website_name}
              onChange={(event) => updateSection("general", { website_name: event.target.value })}
              className="border-zinc-700 bg-zinc-950 text-white"
            />
          </Field>
          <Field label="Support email" icon={<Mail className="h-3.5 w-3.5" />}>
            <Input
              type="email"
              value={settings.general.support_email}
              onChange={(event) => updateSection("general", { support_email: event.target.value })}
              className="border-zinc-700 bg-zinc-950 text-white"
            />
          </Field>
          <Field label="Support phone" icon={<Phone className="h-3.5 w-3.5" />}>
            <Input
              value={settings.general.support_phone}
              onChange={(event) => updateSection("general", { support_phone: event.target.value })}
              className="border-zinc-700 bg-zinc-950 text-white"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Currency code">
              <Input
                value={settings.general.currency_code}
                onChange={(event) => updateSection("general", { currency_code: event.target.value.toUpperCase() })}
                className="border-zinc-700 bg-zinc-950 text-white"
              />
            </Field>
            <Field label="Currency symbol">
              <Input
                value={settings.general.currency_symbol}
                onChange={(event) => updateSection("general", { currency_symbol: event.target.value })}
                className="border-zinc-700 bg-zinc-950 text-white"
              />
            </Field>
          </div>
        </Section>

        <Section
          title="Payment Settings"
          description="Gateway switches and support messaging. API secrets stay in backend .env."
          icon={<CreditCard className="h-4 w-4" />}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <StatusCard label="UddoktaPay API URL" ok={environment.uddoktapay_api_url_configured} />
            <StatusCard label="UddoktaPay API Key" ok={environment.uddoktapay_api_key_configured} />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Toggle
              label="UddoktaPay online payment"
              checked={settings.payments.uddoktapay_enabled}
              onChange={(checked) => updateSection("payments", { uddoktapay_enabled: checked })}
            />
            <Toggle
              label="Free enrollment"
              checked={settings.payments.free_enrollment_enabled}
              onChange={(checked) => updateSection("payments", { free_enrollment_enabled: checked })}
            />
            <Toggle
              label="Manual payment"
              checked={settings.payments.manual_payment_enabled}
              onChange={(checked) => updateSection("payments", { manual_payment_enabled: checked })}
            />
            <Toggle
              label="Sandbox mode"
              checked={settings.payments.sandbox_mode}
              onChange={(checked) => updateSection("payments", { sandbox_mode: checked })}
            />
          </div>

          <Field label="Payment support text">
            <textarea
              value={settings.payments.payment_support_text}
              onChange={(event) => updateSection("payments", { payment_support_text: event.target.value })}
              rows={3}
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
          </Field>

          <Field label="Manual payment instructions">
            <textarea
              value={settings.payments.manual_payment_instructions}
              onChange={(event) => updateSection("payments", { manual_payment_instructions: event.target.value })}
              rows={5}
              placeholder="Example: Send payment to bKash/Nagad number, then contact support with transaction ID."
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
          </Field>
        </Section>

        <Section
          title="Maintenance Mode"
          description="Prepare the message shown when maintenance mode is enabled."
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          <Toggle
            label="Enable maintenance mode"
            checked={settings.maintenance.enabled}
            onChange={(checked) => updateSection("maintenance", { enabled: checked })}
            danger
          />
          <Field label="Maintenance title">
            <Input
              value={settings.maintenance.title}
              onChange={(event) => updateSection("maintenance", { title: event.target.value })}
              className="border-zinc-700 bg-zinc-950 text-white"
            />
          </Field>
          <Field label="Maintenance message">
            <textarea
              value={settings.maintenance.message}
              onChange={(event) => updateSection("maintenance", { message: event.target.value })}
              rows={4}
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
          </Field>
          <Field label="Allowed IPs">
            <textarea
              value={allowedIpText}
              onChange={(event) => setAllowedIpText(event.target.value)}
              rows={4}
              placeholder="One IP per line"
              className="w-full resize-none rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-primary"
            />
          </Field>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="mb-5 flex gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        </div>
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 flex items-center gap-1.5 text-zinc-300">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  danger = false,
  onChange,
}: {
  label: string;
  checked: boolean;
  danger?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <span className="text-sm font-medium text-zinc-200">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className={`h-5 w-5 accent-primary ${danger ? "accent-rose-500" : ""}`}
      />
    </label>
  );
}

function StatusCard({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 p-3">
      <span className="text-sm text-zinc-300">{label}</span>
      <span
        className={
          "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] " +
          (ok ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300")
        }
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        {ok ? "Configured" : "Missing"}
      </span>
    </div>
  );
}
