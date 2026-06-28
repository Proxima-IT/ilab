import { useEffect } from "react";
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

export default function HomePage() {
  useEffect(() => {
    document.title = "Mobile Repairing Courses in Bangladesh | iLab BD";
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-surface/30">
      <Header />
      <Hero />
      <AdmissionTimeline />
      <BatchPreview />
      <WhatWeOffer />
      <FreeCourses />
      <Courses />
      
      <Reviews />
      <Blog />
      <DownloadApp />
      <YouTubeSection />
      <Footer />
    </main>
  );
}
