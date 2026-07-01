import { useEffect, useState } from "react";
import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { AdmissionTimeline } from "@/components/site/AdmissionTimeline";
import { BatchPreview } from "@/components/site/BatchPreview";
import { WhatWeOffer } from "@/components/site/WhatWeOffer";
import { FreeCourses } from "@/components/site/FreeCourses";
import { Courses } from "@/components/site/Courses";
import { Reviews } from "@/components/site/Reviews";
import { Blog } from "@/components/site/Blog";
import { DownloadApp } from "@/components/site/DownloadApp";
import { YouTubeSection } from "@/components/site/YouTubeSection";
import { Footer } from "@/components/site/Footer";
import {
  fetchWebsiteSettings,
  type WebsiteSettings,
} from "@/services/home.service";

export default function HomePage() {
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    document.title = "Mobile Repairing Courses in Bangladesh | iLab BD";
  }, []);

  useEffect(() => {
    let mounted = true;

    fetchWebsiteSettings()
      .then((data) => {
        if (mounted) setSettings(data);
      })
      .catch(() => {
        if (mounted) setSettings(null);
      })
      .finally(() => {
        if (mounted) setSettingsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-surface/30">
      <Header />
      {settingsLoading ? (
        <HomeSettingsSkeleton />
      ) : (
        <>
          <Hero settings={settings?.hero} />
          <AdmissionTimeline />
          <BatchPreview settings={settings?.next_batch} />
          <WhatWeOffer settings={settings?.offers} />
          <FreeCourses />
          <Courses />
          <Reviews settings={settings?.reviews} />
          <Blog />
          <DownloadApp settings={settings?.download_app} />
          <YouTubeSection />
        </>
      )}
      <Footer />
    </main>
  );
}

function HomeSettingsSkeleton() {
  return (
    <div className="pt-20">
      <section className="mx-auto grid min-h-[680px] max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="flex flex-col justify-center">
          <div className="h-12 w-11/12 animate-pulse rounded-lg bg-muted" />
          <div className="mt-4 h-12 w-4/5 animate-pulse rounded-lg bg-muted" />
          <div className="mt-8 h-5 w-3/4 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-5 w-2/3 animate-pulse rounded bg-muted" />
          <div className="mt-10 flex gap-4">
            <div className="h-14 w-44 animate-pulse rounded-md bg-muted" />
            <div className="h-14 w-44 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        </div>
        <div className="hidden min-h-[560px] animate-pulse rounded-3xl bg-muted lg:block" />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto h-10 w-72 animate-pulse rounded-lg bg-muted" />
        <div className="mx-auto mt-4 h-5 w-96 max-w-full animate-pulse rounded bg-muted" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </section>
    </div>
  );
}
