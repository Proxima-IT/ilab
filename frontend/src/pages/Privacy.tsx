import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { applySeo } from "@/lib/seo";

const sections = [
  {
    title: "1. Information We Collect",
    body: [
      "When you create an account, we may collect your name, email address, optional phone number, password, avatar, education information, profession, profile bio, and notification preferences.",
      "When you enroll in a course, we may store your course enrollment, payment status, coupon usage, progress, completed lessons, notes, questions, certificates, and learning activity.",
    ],
  },
  {
    title: "2. How We Use Your Information",
    body: [
      "We use your information to create and protect your account, verify your email, provide course access, track learning progress, issue certificates, process enrollments, and improve the platform.",
      "We may send notifications about new lectures, events, offers, Q&A answers, profile updates, course completion, and certificate readiness based on your notification settings.",
    ],
  },
  {
    title: "3. Email Verification and Account Security",
    body: [
      "Manual registration requires email verification. We send verification and password reset codes to protect your account and prevent unauthorized use.",
      "You should keep your password confidential and notify us if you believe your account has been accessed without permission.",
    ],
  },
  {
    title: "4. Payments and Third-Party Services",
    body: [
      "For paid enrollments, payment processing may be handled by third-party payment providers. We store payment records such as payment status, amount, course, coupon, and transaction reference, but we do not store sensitive card or mobile wallet credentials.",
      "Google login, YouTube videos, payment gateways, email services, and Google Drive resources may process certain information according to their own privacy policies.",
    ],
  },
  {
    title: "5. Cookies and Local Storage",
    body: [
      "We may use browser storage and similar technologies to keep you logged in, remember your device, improve security, and support platform features.",
      "You can clear browser storage from your browser settings, but doing so may log you out or reset local preferences.",
    ],
  },
  {
    title: "6. Data Sharing",
    body: [
      "We do not sell your personal information. We may share limited information with trusted service providers only when needed to run the platform, deliver emails, process payments, host content, or provide support.",
      "We may disclose information if required by law, to protect users, prevent fraud, enforce our Terms, or respond to valid legal requests.",
    ],
  },
  {
    title: "7. Data Retention",
    body: [
      "We keep account, enrollment, payment, learning progress, and certificate records as long as needed to provide services, meet legal obligations, prevent fraud, and support student records.",
      "You may request account review or deletion by contacting support. Some records may need to be retained where legally or operationally required.",
    ],
  },
  {
    title: "8. Your Choices",
    body: [
      "You can update your profile, avatar, password, and notification settings from your student dashboard.",
      "You can unsubscribe from marketing-style messages where available, but important account, payment, verification, and course access messages may still be sent.",
    ],
  },
];

export default function PrivacyPage() {
  useEffect(() => {
    const title = "Privacy Policy | iLab BD";
    const description = "Learn how iLab BD collects, uses, protects, and stores student account, course, payment, and learning data.";

    applySeo({
      title,
      description,
      path: "/privacy",
    });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="pt-32 pb-16 bg-gradient-to-b from-surface to-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-primary-dark">Privacy</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            This policy explains what information iLab BD collects, why we use it, and how we protect students and visitors.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Last updated: July 4, 2026
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {sections.map((section) => (
              <article key={section.title} className="border-b border-border pb-8 last:border-b-0">
                <h2 className="text-xl font-bold text-foreground">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-muted-foreground">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-10 rounded-lg border border-border bg-surface p-5">
            <h2 className="text-lg font-bold text-foreground">Contact</h2>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              For privacy questions or data requests, contact us at{" "}
              <a href="mailto:support@ilabbd.com" className="font-semibold text-primary hover:underline">
                support@ilabbd.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

function setMeta(name: string, content: string, property = false) {
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(tag);
  }

  tag.content = content;
}
