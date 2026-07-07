import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  Lock,
  LogIn,
  Mail,
  Tag,
  User as UserIcon,
  Wallet,
  X,
} from "lucide-react";

import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import {
  fetchPublicCourseBySlug,
  type PublicCourseDetails,
} from "@/services/course-catalog.service";
import { useAuth } from "@/lib/auth";
import {
  createUddoktaPayCheckout,
  validateCoupon,
  type CouponResult,
} from "@/services/payments";
import { studentProfileService } from "@/services/student/profile.service";
import { applySeo } from "@/lib/seo";

const TAKA_SIGN = "\u09F3";
const UDDOKTAPAY_LOGO = "https://uddoktapay.com/assets/images/logo.png";

function firstError(error: unknown, fallback: string) {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
    .response?.data;
  return data?.errors ? Object.values(data.errors)[0]?.[0] || fallback : data?.message || fallback;
}

export default function EnrollPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, isStudent } = useAuth();
  const [course, setCourse] = useState<PublicCourseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingEnrollment, setCheckingEnrollment] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchPublicCourseBySlug(slug).then((res) => {
      if (cancelled) return;
      if (!res) {
        setError(true);
        setLoading(false);
        return;
      }
      setCourse(res);
      setCheckingEnrollment(Boolean(isAuthenticated && isStudent));
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [isAuthenticated, isStudent, slug]);

  const fullName = user?.name ?? "";
  const email = user?.email ?? "";
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(true);

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponResult | null>(null);
  const [couponState, setCouponState] = useState<"idle" | "checking" | "invalid">("idle");

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!course) return;

    applySeo({
      title: `Enroll in ${course.title} | iLab BD`,
      description: `Complete your secure enrollment for ${course.title} on iLab BD.`,
      path: `/enroll/${course.slug}`,
      image: course.cover || null,
      robots: "noindex,nofollow",
    });
  }, [course]);

  const pricing = useMemo(() => {
    if (!course) return { base: 0, couponDiscount: 0, subtotal: 0, tax: 0, total: 0 };
    const base = course.price;
    const couponDiscount = coupon ? Math.min(base, Math.round(coupon.discountAmount)) : 0;
    const subtotal = base - couponDiscount;
    const tax = 0; // no VAT for now
    const total = subtotal + tax;
    return { base, couponDiscount, subtotal, tax, total };
  }, [course, coupon]);

  useEffect(() => {
    if (!course || !isAuthenticated || !user || !isStudent) return;

    let cancelled = false;
    setCheckingEnrollment(true);

    studentProfileService
      .getProfile()
      .then((response) => {
        if (cancelled) return;

        const enrollments = Array.isArray(response.data.user.enrollments)
          ? (response.data.user.enrollments as any[])
          : [];
        const enrollment = enrollments.find((item) => {
          return item?.course?.slug === course.slug || String(item?.course_id || "") === course.id;
        });

        if (!enrollment || ["suspended", "expired"].includes(String(enrollment.status || ""))) {
          return;
        }

        const firstLessonId = enrollment.course?.sections
          ?.flatMap((section: any) => Array.isArray(section.lessons) ? section.lessons : [])
          ?.sort((a: any, b: any) => Number(a.order || 0) - Number(b.order || 0))?.[0]?.id;

        navigate(
          firstLessonId
            ? `/dashboard/player/${course.slug}/${firstLessonId}`
            : "/dashboard/my-courses",
          { replace: true }
        );
      })
      .finally(() => {
        if (!cancelled) setCheckingEnrollment(false);
      });

    return () => {
      cancelled = true;
    };
  }, [course, isAuthenticated, isStudent, navigate, user]);

  if (loading || checkingEnrollment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen grid place-items-center bg-background px-6 text-center">
        <div>
          <p className="text-lg font-bold">Course not found</p>
          <Link to="/courses" className="mt-4 inline-block rounded-full bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold">
            Browse courses
          </Link>
        </div>
      </div>
    );
  }

  async function applyCoupon() {
    if (!course) return;
    if (!couponInput.trim()) return;
    setCouponState("checking");
    try {
      const result = await validateCoupon(couponInput, course.id);

      if (!result) {
        setCoupon(null);
        setCouponState("invalid");
        return;
      }

      setCoupon(result);
      setCouponState("idle");
    } catch {
      setCoupon(null);
      setCouponState("invalid");
    }
  }

  function clearCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponState("idle");
  }

  function validate() {
    const next: Record<string, string> = {};
    if (!/^(?:\+?880|0)1[3-9]\d{8}$/.test(phone.replace(/\s|-/g, ""))) next.phone = "Enter a valid BD mobile number (e.g. 017XXXXXXXX)";
    if (!agree) next.agree = "You must accept the terms to continue";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!course) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await createUddoktaPayCheckout({
        courseId: course.id,
        courseSlug: course.slug,
        courseTitle: course.title,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        amount: pricing.total,
        coupon: coupon?.code,
      });
      // Real flow → window.location.href = result.paymentUrl
      if (result.isFree || result.redirectUrl) {
        navigate(`/enroll/success?invoice_id=${encodeURIComponent(result.invoiceId)}`);
        return;
      }

      if (result.paymentUrl) {
        window.location.href = result.paymentUrl;
        return;
      }

      navigate(`/enroll/success?invoice_id=${encodeURIComponent(result.invoiceId)}`);
    } catch (error) {
      setErrors((current) => ({
        ...current,
        submit: firstError(error, "Checkout could not be initialized. Please try again."),
      }));
    } finally {
      setSubmitting(false);
    }
  }

  if (!isAuthenticated || !user || !isStudent) {
    return <LoginRequired course={course} isWrongRole={Boolean(user && !isStudent)} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {/* breadcrumb */}
        <div className="border-b border-border bg-surface/50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between text-sm">
            <Link
              to={`/courses/${course.slug}`}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition"
            >
              <ArrowLeft className="h-4 w-4" /> Back to course
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-3xl mb-8"
          >
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-dark">Enroll · Step 1 of 2</p>
            <h1 className="mt-2 text-2xl md:text-4xl font-extrabold text-foreground">
              Complete your enrollment
            </h1>
            <p className="mt-2 text-muted-foreground text-sm md:text-base">
              You're one step away from joining <span className="font-semibold text-foreground">{course.title}</span>.
            </p>
          </motion.div>

          <form onSubmit={onSubmit} className="grid lg:grid-cols-[1fr_400px] gap-8 items-start">
            {/* LEFT — form */}
            <div className="space-y-6">
              {/* Signed-in account */}
              <FormCard
                step="1"
                title="Your account"
                subtitle="We'll send your invoice and access details to this email."
              >
                <div className="rounded-xl border border-border bg-surface/60 p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid place-items-center h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary-glow text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground inline-flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 text-muted-foreground" /> {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3.5 w-3.5" /> {user.email}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success px-2.5 py-1 text-[11px] font-bold">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  </div>
                </div>
                <Field
                  label="Mobile number (Bangladesh)"
                  type="tel"
                  error={errors.phone}
                  value={phone}
                  onChange={setPhone}
                  placeholder="017XXXXXXXX"
                  autoComplete="tel"
                  hint="Used for payment confirmation OTP from your wallet."
                />
              </FormCard>

              {/* Coupon */}
              <FormCard step="2" title="Have a coupon?" subtitle="Enter your promo code if you have one.">
                {coupon ? (
                  <div className="flex items-center gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3">
                    <BadgeCheck className="h-5 w-5 text-success" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{coupon.code} applied</p>
                      <p className="text-xs text-muted-foreground">{coupon.label}</p>
                    </div>
                    <button
                      type="button"
                      onClick={clearCoupon}
                      className="rounded-full p-1.5 hover:bg-foreground/5 transition"
                      aria-label="Remove coupon"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponState("idle");
                          }}
                          placeholder="Enter coupon code"
                          className="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-3 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponState === "checking" || !couponInput.trim()}
                        className="rounded-xl bg-foreground text-background px-5 text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition"
                      >
                        {couponState === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </button>
                    </div>
                    {couponState === "invalid" && (
                      <p className="mt-2 text-xs text-destructive">Invalid or expired coupon code.</p>
                    )}
                  </div>
                )}
              </FormCard>
              {/* Payment method */}
              <FormCard
                step="3"
                title="Payment method"
                subtitle="You will choose bKash, Nagad, or another available option inside UddoktaPay checkout."
              >
                <div className="rounded-xl border-2 border-primary bg-primary/5 p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-32 shrink-0 place-items-center rounded-lg bg-white p-3 shadow-sm">
                      <img
                        src={UDDOKTAPAY_LOGO}
                        alt="UddoktaPay logo"
                        className="max-h-10 max-w-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">UddoktaPay secure checkout</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Complete payment safely through UddoktaPay. Available payment options will appear on the next page.
                      </p>
                    </div>
                  </div>
                </div>
              </FormCard>
            </div>

            {/* RIGHT — order summary */}
            <aside className="lg:sticky lg:top-24">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="rounded-2xl border border-border bg-card shadow-card overflow-hidden"
              >
                <div className="p-5 border-b border-border">
                  <div className="flex gap-3">
                    <img src={course.cover} alt="" className="h-16 w-24 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark">{course.category}</p>
                      <p className="mt-0.5 text-sm font-bold text-foreground line-clamp-2">{course.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">by {course.instructor}</p>
                    </div>
                  </div>
                </div>

                <div className="p-5 space-y-2.5 text-sm">
                  <Row label="Course price" value={`৳${pricing.base.toLocaleString()}`} />
                  {course.originalPrice && course.originalPrice > course.price && (
                    <Row
                      label="Instant discount"
                      value={`− ৳${(course.originalPrice - course.price).toLocaleString()}`}
                      muted
                    />
                  )}
                  {coupon && (
                    <Row
                      label={`Coupon (${coupon.code})`}
                      value={`− ৳${pricing.couponDiscount.toLocaleString()}`}
                      highlight
                    />
                  )}
                  <Row label="VAT" value="৳0" muted />
                </div>

                <div className="px-5 py-4 bg-surface/70 border-t border-border flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-muted-foreground">Total payable</span>
                  <span className="text-2xl font-extrabold text-foreground tabular-nums">৳{pricing.total.toLocaleString()}</span>
                </div>

                <div className="p-5 space-y-3">
                  <label className="flex items-start gap-2.5 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => setAgree(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                    />
                    <span>
                      I agree to iLab's{" "}
                      <Link to="/terms" className="font-semibold text-primary hover:underline">Terms</Link>{" "}
                      and{" "}
                      <Link to="/privacy" className="font-semibold text-primary hover:underline">Privacy Policy</Link>
                      , and authorize this payment via UddoktaPay.
                    </span>
                  </label>
                  {errors.agree && <p className="text-xs text-destructive">{errors.agree}</p>}
                  {errors.submit && <p className="text-xs text-destructive">{errors.submit}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full gradient-orange py-3.5 text-sm font-bold text-white shadow-orange-glow hover:scale-[1.02] active:scale-[0.99] transition-transform disabled:opacity-70 disabled:cursor-wait disabled:hover:scale-100"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Redirecting to UddoktaPay…
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4" /> Pay ৳{pricing.total.toLocaleString()} securely
                      </>
                    )}
                  </button>
                </div>
              </motion.div>

              <p className="mt-4 text-xs text-muted-foreground text-center">
                Need help? <a href="mailto:support@ilab.com.bd" className="text-primary font-semibold hover:underline">support@ilab.com.bd</a>
              </p>
            </aside>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

/* --------------------- bits --------------------- */

function FormCard({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-card"
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="grid place-items-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
          {step}
        </span>
        <div>
          <h2 className="text-base md:text-lg font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  hint,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`mt-1.5 w-full rounded-xl border bg-background px-3.5 py-3 text-sm focus:outline-none focus:ring-2 transition ${
          error
            ? "border-destructive focus:ring-destructive/30"
            : "border-border focus:ring-primary/40 focus:border-primary/50"
        }`}
      />
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </label>
  );
}

function Row({ label, value, muted, highlight }: { label: string; value: string; muted?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : "text-foreground/80"}>{label}</span>
      <span
        className={`font-semibold tabular-nums ${
          highlight ? "text-success" : muted ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function LoginRequired({ course, isWrongRole = false }: { course: PublicCourseDetails; isWrongRole?: boolean }) {
  const redirect = `/enroll/${course.slug}`;
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 grid place-items-center px-4 pb-16 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md rounded-2xl border border-border bg-card shadow-card p-7 text-center"
        >
          <div className="mx-auto grid place-items-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-white">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-foreground">
            {isWrongRole ? "Student account required" : "Login required"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isWrongRole
              ? "Please log in with a student account to enroll in "
              : "Enrollment is only available to signed-in students. Please log in or create a free account to enroll in "}
            <span className="font-semibold text-foreground">{course.title}</span>.
          </p>

          <div className="mt-4 rounded-xl border border-border bg-surface/60 p-3 flex items-center gap-3 text-left">
            <img src={course.cover} alt="" className="h-12 w-16 rounded-md object-cover shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark">{course.category}</p>
              <p className="text-sm font-bold text-foreground line-clamp-1">{course.title}</p>
              <p className="text-xs text-muted-foreground">৳{course.price.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-2.5">
            <Link
              to={`/login?redirect=${encodeURIComponent(redirect)}`}
              className="inline-flex items-center justify-center gap-2 rounded-full gradient-orange py-3 text-sm font-bold text-white shadow-orange-glow hover:scale-[1.02] transition-transform"
            >
              <LogIn className="h-4 w-4" /> Login to continue
            </Link>
            <Link
              to={`/signup?redirect=${encodeURIComponent(redirect)}`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-bold text-foreground hover:bg-surface transition"
            >
              Create a free account
            </Link>
            <Link
              to={`/courses/${course.slug}`}
              className="mt-1 text-xs text-muted-foreground hover:text-foreground transition"
            >
              ← Back to course details
            </Link>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
