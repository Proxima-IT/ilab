import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { applySeo } from "@/lib/seo";

const sections = [
  {
    title: "1. Account Registration",
    body: [
      "You must provide accurate information when creating an iLab BD account. Your email address is required for account verification, course access, and important account notices.",
      "You are responsible for keeping your password secure. Any activity from your account will be treated as your own unless you notify us about unauthorized access.",
    ],
  },
  {
    title: "2. Course Access",
    body: [
      "After successful enrollment, you will receive access to the purchased or free course through your student dashboard.",
      "Course access is for personal learning only. You may not share, resell, copy, download, screen-record for distribution, or publicly publish iLab BD course materials without written permission.",
    ],
  },
  {
    title: "3. Payments, Discounts, and Enrollment",
    body: [
      "Course prices, discounts, and coupon availability may change at any time. The final payable amount is calculated by our backend system during enrollment.",
      "Enrollment is confirmed only after a successful payment confirmation or after a free course enrollment is accepted by the system.",
    ],
  },
  {
    title: "4. Learning Conduct",
    body: [
      "Students must use the platform respectfully. Harassment, spam, abusive comments, fraudulent activity, or attempts to bypass course security may lead to suspension.",
      "Questions, notes, reviews, and profile information submitted by students must not include unlawful, harmful, misleading, or offensive content.",
    ],
  },
  {
    title: "5. Certificates",
    body: [
      "Certificates may be issued when a student meets the required course completion criteria. iLab BD may verify certificate authenticity through certificate codes or records.",
      "We may refuse or cancel a certificate if course access, payment, identity, or completion records are found to be invalid or manipulated.",
    ],
  },
  {
    title: "6. Platform Availability",
    body: [
      "We try to keep the platform available and secure, but maintenance, technical issues, internet problems, third-party service issues, or security work may temporarily affect access.",
      "iLab BD is not responsible for losses caused by service interruptions outside our reasonable control.",
    ],
  },
  {
    title: "7. Changes to These Terms",
    body: [
      "We may update these Terms from time to time. The latest version on this page will apply to your continued use of iLab BD.",
    ],
  },
];

export default function TermsPage() {
  useEffect(() => {
    const title = "Terms and Conditions | iLab BD";
    const description = "Read the iLab BD terms for account registration, course access, payments, certificates, and student conduct.";

    applySeo({
      title,
      description,
      path: "/terms",
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
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-primary-dark">Legal</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
            Terms and Conditions
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            These terms explain how students, visitors, and staff should use iLab BD courses, services, and learning platform.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
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
              For questions about these Terms, contact us at{" "}
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
