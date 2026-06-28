// Mock course data + service. Swap for Laravel API later.
export type Level = "Beginner" | "Intermediate" | "Advanced";
export type Category =
  | "Web Development"
  | "Data Science"
  | "Design"
  | "Marketing"
  | "Business"
  | "Mobile";
export type Mode = "Online" | "Offline";

export type Course = {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  category: Category;
  level: Level;
  mode: Mode;
  rating: number;
  students: number;
  hours: number;
  lessons: number;
  price: number;
  originalPrice?: number;
  tag?: string;
  cover: string;
  createdAt: string; // ISO
};

const COVERS = [
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1481487196290-c152efe083f5?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=900&q=80",
];

const MOCK: Course[] = ([
  { title: "Full-Stack Web Development with React & Laravel", instructor: "Rahim Hossain", category: "Web Development", level: "Intermediate", mode: "Online", rating: 4.9, students: 3240, hours: 64, lessons: 142, price: 8500, originalPrice: 12000, tag: "Bestseller" },
  { title: "Data Science & Machine Learning Bootcamp", instructor: "Dr. Tahmina Ahmed", category: "Data Science", level: "Advanced", mode: "Online", rating: 4.8, students: 2100, hours: 80, lessons: 168, price: 9500, originalPrice: 13500, tag: "New" },
  { title: "UI/UX Design Mastery — Figma to Production", instructor: "Nabila Karim", category: "Design", level: "Beginner", mode: "Offline", rating: 4.9, students: 1850, hours: 42, lessons: 96, price: 6500, originalPrice: 9000, tag: "Popular" },
  { title: "Digital Marketing & Growth Strategy", instructor: "Imran Chowdhury", category: "Marketing", level: "Intermediate", mode: "Online", rating: 4.7, students: 2780, hours: 36, lessons: 72, price: 5500, originalPrice: 8000, tag: "Hot" },
  { title: "React Native — Build iOS & Android Apps", instructor: "Sajid Karim", category: "Mobile", level: "Intermediate", mode: "Online", rating: 4.7, students: 1420, hours: 48, lessons: 110, price: 7500, originalPrice: 10000 },
  { title: "Python for Beginners", instructor: "Farzana Yasmin", category: "Web Development", level: "Beginner", mode: "Online", rating: 4.6, students: 5120, hours: 28, lessons: 60, price: 3500, originalPrice: 5000, tag: "Beginner Friendly" },
  { title: "Advanced TypeScript Patterns", instructor: "Mehedi Hasan", category: "Web Development", level: "Advanced", mode: "Online", rating: 4.9, students: 980, hours: 22, lessons: 48, price: 6000 },
  { title: "Brand Identity & Visual Design", instructor: "Nabila Karim", category: "Design", level: "Intermediate", mode: "Offline", rating: 4.8, students: 1230, hours: 30, lessons: 64, price: 5500, originalPrice: 7500 },
  { title: "SEO Mastery — Rank on Google", instructor: "Imran Chowdhury", category: "Marketing", level: "Beginner", mode: "Online", rating: 4.5, students: 3340, hours: 18, lessons: 42, price: 2500, originalPrice: 4000 },
  { title: "Excel & Power BI for Business", instructor: "Rafiqul Islam", category: "Business", level: "Beginner", mode: "Offline", rating: 4.6, students: 2890, hours: 24, lessons: 55, price: 3000 },
  { title: "Flutter — One Codebase, Two Platforms", instructor: "Sajid Karim", category: "Mobile", level: "Intermediate", mode: "Online", rating: 4.7, students: 1610, hours: 40, lessons: 88, price: 6500 },
  { title: "Deep Learning with PyTorch", instructor: "Dr. Tahmina Ahmed", category: "Data Science", level: "Advanced", mode: "Online", rating: 4.9, students: 740, hours: 56, lessons: 102, price: 11000, originalPrice: 15000, tag: "Advanced" },
  { title: "Product Management Essentials", instructor: "Anisa Begum", category: "Business", level: "Intermediate", mode: "Offline", rating: 4.7, students: 1140, hours: 26, lessons: 52, price: 5000 },
  { title: "Motion Design with After Effects", instructor: "Ridwan Ali", category: "Design", level: "Intermediate", mode: "Offline", rating: 4.8, students: 980, hours: 34, lessons: 70, price: 5500 },
  { title: "Node.js & API Architecture", instructor: "Mehedi Hasan", category: "Web Development", level: "Intermediate", mode: "Online", rating: 4.8, students: 1820, hours: 38, lessons: 84, price: 6800, originalPrice: 9500 },
  { title: "Social Media Marketing 2026", instructor: "Imran Chowdhury", category: "Marketing", level: "Beginner", mode: "Online", rating: 4.5, students: 4210, hours: 20, lessons: 46, price: 2800, originalPrice: 4500 },
  { title: "Data Visualization with D3", instructor: "Dr. Tahmina Ahmed", category: "Data Science", level: "Intermediate", mode: "Online", rating: 4.6, students: 690, hours: 30, lessons: 64, price: 5500 },
  { title: "Entrepreneurship 101", instructor: "Anisa Begum", category: "Business", level: "Beginner", mode: "Offline", rating: 4.7, students: 1980, hours: 22, lessons: 48, price: 3500 },
  { title: "iOS Development with Swift", instructor: "Sajid Karim", category: "Mobile", level: "Advanced", mode: "Online", rating: 4.8, students: 540, hours: 52, lessons: 96, price: 8500 },
  { title: "Web Animation with GSAP & Framer", instructor: "Ridwan Ali", category: "Web Development", level: "Intermediate", mode: "Online", rating: 4.9, students: 1230, hours: 24, lessons: 52, price: 4800, tag: "Hot" },
  { title: "Mobile Repairing Fundamentals", instructor: "Md. Rakib Hasan", category: "Mobile", level: "Beginner", mode: "Offline", rating: 4.7, students: 3200, hours: 12, lessons: 28, price: 0, tag: "Free" },
  { title: "Smartphone Software Troubleshooting", instructor: "Tania Akter", category: "Mobile", level: "Beginner", mode: "Online", rating: 4.6, students: 1850, hours: 8, lessons: 18, price: 0, tag: "Free" },
] as Omit<Course, "id" | "slug" | "cover" | "createdAt">[]).map((c, i) => ({
  ...c,
  id: String(i + 1),
  slug: c.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  cover: COVERS[i % COVERS.length],
  createdAt: new Date(2026, 5, 20 - i).toISOString(),
}));

export const CATEGORIES: Category[] = [
  "Web Development",
  "Data Science",
  "Design",
  "Marketing",
  "Business",
  "Mobile",
];
export const LEVELS: Level[] = ["Beginner", "Intermediate", "Advanced"];
export const MODES: Mode[] = ["Online", "Offline"];
export const SORTS = ["newest", "popular", "rating", "price-asc", "price-desc"] as const;
export type Sort = (typeof SORTS)[number];

export type CoursesQuery = {
  q?: string;
  category?: string;
  level?: string;
  mode?: string;
  sort?: Sort;
  page?: number;
  perPage?: number;
  free?: boolean;
};

export type CoursesResult = {
  items: Course[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

// Mock async fetcher — replace with real fetch() to Laravel later.
export async function fetchCourses(query: CoursesQuery = {}): Promise<CoursesResult> {
  const { q = "", category = "", level = "", mode = "", sort = "newest", page = 1, perPage = 9, free } = query;

  // simulate latency
  await new Promise((r) => setTimeout(r, 200));

  let items = [...MOCK];

  if (free === true) items = items.filter((c) => c.price === 0);
  if (free === false) items = items.filter((c) => c.price > 0);

  if (q.trim()) {
    const needle = q.trim().toLowerCase();
    items = items.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        c.instructor.toLowerCase().includes(needle) ||
        c.category.toLowerCase().includes(needle),
    );
  }
  if (category) items = items.filter((c) => c.category === category);
  if (level) items = items.filter((c) => c.level === level);
  if (mode) items = items.filter((c) => c.mode === mode);

  switch (sort) {
    case "popular": items.sort((a, b) => b.students - a.students); break;
    case "rating": items.sort((a, b) => b.rating - a.rating); break;
    case "price-asc": items.sort((a, b) => a.price - b.price); break;
    case "price-desc": items.sort((a, b) => b.price - a.price); break;
    case "newest":
    default:
      items.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  const paginated = items.slice(start, start + perPage);

  return { items: paginated, total, page: safePage, perPage, totalPages };
}

// -------------------- Course Details (mock) --------------------

export type LessonType = "video" | "pdf" | "quiz" | "live";

export type DetailLesson = {
  id: string;
  title: string;
  type: LessonType;
  duration: string; // e.g. "12:34"
  preview?: boolean;
};

export type DetailSection = {
  id: string;
  title: string;
  lessons: DetailLesson[];
};

export type DetailReview = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  completed?: boolean;
};

export type DetailFAQ = { q: string; a: string };

export type InstructorProfile = {
  name: string;
  title: string;
  avatar: string;
  bio: string;
  experience: string;
  rating: number;
  students: number;
  courses: number;
  badges: string[];
};

export type CourseDetails = Course & {
  description: string;
  language: string;
  updatedAt: string;
  introVideo: string;
  outcomes: string[];
  requirements: string[];
  audience: { title: string; desc: string }[];
  includes: { label: string; icon: string }[];
  sections: DetailSection[];
  instructorProfile: InstructorProfile;
  reviews: DetailReview[];
  ratingDistribution: { stars: number; pct: number }[];
  faqs: DetailFAQ[];
};

const AVATARS = [
  "https://i.pravatar.cc/120?img=12",
  "https://i.pravatar.cc/120?img=32",
  "https://i.pravatar.cc/120?img=47",
  "https://i.pravatar.cc/120?img=56",
  "https://i.pravatar.cc/120?img=68",
  "https://i.pravatar.cc/120?img=15",
];

function buildSections(totalLessons: number): DetailSection[] {
  const sectionCount = 6;
  const per = Math.max(4, Math.round(totalLessons / sectionCount));
  const sectionTitles = [
    "Getting Started & Setup",
    "Core Concepts & Foundations",
    "Hands-on Practical Workflow",
    "Real-World Projects",
    "Advanced Techniques & Patterns",
    "Capstone, Certification & Career",
  ];
  const types: LessonType[] = ["video", "video", "video", "pdf", "video", "quiz", "video", "live"];
  let counter = 0;
  return sectionTitles.map((t, si) => ({
    id: `s${si + 1}`,
    title: t,
    lessons: Array.from({ length: per }).map((_, li) => {
      counter += 1;
      const type = types[(si + li) % types.length];
      const mins = 6 + ((si * 3 + li) % 18);
      const secs = ((li * 17) % 60).toString().padStart(2, "0");
      return {
        id: `l${counter}`,
        title: `${t.split(" ")[0]} — Lesson ${li + 1}`,
        type,
        duration: type === "quiz" ? "10 questions" : `${mins}:${secs}`,
        preview: si === 0 && li < 2,
      };
    }),
  }));
}

function buildReviews(): DetailReview[] {
  const names = ["Tania R.", "Karim H.", "Mehedi A.", "Sumaiya P.", "Naimul I.", "Rakib H."];
  const blurbs = [
    "Hands-down the most practical course I've taken. The mentor reviews every project personally — felt like a real cohort.",
    "Curriculum is dense but extremely well-paced. The capstone alone is worth the price.",
    "Within three weeks I landed a freelance gig using exactly what I learned in module 4. Worth every taka.",
    "The community is what makes iLab different. I always had someone to unblock me in under an hour.",
    "Production-grade content. None of that watered-down 'hello world' fluff you see elsewhere.",
    "Loved the live sessions. Recordings + transcripts make it easy to revisit.",
  ];
  return names.map((n, i) => ({
    id: `r${i + 1}`,
    name: n,
    avatar: AVATARS[i],
    rating: 5 - (i % 2 === 0 ? 0 : i === 3 ? 1 : 0),
    date: `${1 + i} week${i ? "s" : ""} ago`,
    text: blurbs[i],
    completed: i % 2 === 0,
  }));
}

export async function fetchCourseBySlug(slug: string): Promise<CourseDetails | null> {
  await new Promise((r) => setTimeout(r, 150));
  const base = MOCK.find((c) => c.slug === slug);
  if (!base) return null;

  return {
    ...base,
    description:
      "A practical, project-driven course built by senior industry mentors. You'll go from fundamentals to shipping real, production-grade work — with weekly 1:1 reviews, a private community, and career support.",
    language: "English + বাংলা",
    updatedAt: new Date(2026, 4, 12).toISOString(),
    introVideo:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    outcomes: [
      `Master ${base.category.toLowerCase()} workflows used by top product teams`,
      "Build and ship 4 portfolio-grade projects from scratch",
      "Read, debug and architect real-world codebases with confidence",
      "Apply industry best practices, testing and performance patterns",
      "Crack interviews with mentor-led mock sessions and feedback",
      "Earn a verifiable iLab certificate recognized by hiring partners",
    ],
    requirements: [
      "A laptop or desktop with a stable internet connection",
      "Basic computer literacy — no prior experience required",
      "3–5 hours per week of focused practice time",
      "Curiosity and commitment to finishing the capstone",
    ],
    audience: [
      { title: "Absolute Beginners", desc: "Start from zero with a structured, hand-held path." },
      { title: "Career Switchers", desc: "Build a portfolio strong enough to land your first role." },
      { title: "Working Professionals", desc: "Level up your craft with senior-mentor reviews." },
      { title: "Freelancers", desc: "Win higher-paying clients with production-grade skills." },
      { title: "Students", desc: "Bridge the gap between university and industry." },
      { title: "Founders & Makers", desc: "Ship your own product end-to-end with confidence." },
    ],
    includes: [
      { label: `${base.hours}+ hours of HD video lessons`, icon: "video" },
      { label: "Downloadable resources & cheat sheets", icon: "download" },
      { label: "Verified certificate of completion", icon: "award" },
      { label: "Lifetime access & free updates", icon: "infinity" },
      { label: "Watch on mobile, tablet and desktop", icon: "smartphone" },
      { label: "Private community + weekly live Q&A", icon: "users" },
    ],
    sections: buildSections(base.lessons),
    instructorProfile: {
      name: base.instructor,
      title: `Senior ${base.category} Mentor · ex-Pathao, ex-Brain Station 23`,
      avatar: AVATARS[Math.floor(base.title.length) % AVATARS.length],
      bio: `${base.instructor} has 9+ years of hands-on industry experience leading product teams. They've mentored 3,000+ students across cohorts and built training programs for engineering teams at leading tech companies in Bangladesh and beyond.`,
      experience: "9+ years industry experience",
      rating: 4.9,
      students: 12480,
      courses: 7,
      badges: ["Top Mentor 2025", "iLab Certified", "Industry Expert"],
    },
    reviews: buildReviews(),
    ratingDistribution: [
      { stars: 5, pct: 78 },
      { stars: 4, pct: 16 },
      { stars: 3, pct: 4 },
      { stars: 2, pct: 1 },
      { stars: 1, pct: 1 },
    ],
    faqs: [
      { q: "Do I need previous experience?", a: "No — the course starts from absolute fundamentals and builds gradually to advanced topics." },
      { q: "Will I get a certificate?", a: "Yes. After completing the capstone you'll receive a verifiable iLab certificate with a unique verification ID." },
      { q: "Can I watch lessons on mobile?", a: "Absolutely. All lessons are streamable on iOS, Android, tablet and desktop with offline downloads on the mobile app." },
      { q: "How long will I have access?", a: "Lifetime access. You also receive free updates whenever the curriculum is refreshed." },
      { q: "Are there downloadable resources?", a: "Yes — every section ships with cheat sheets, source files, slides and project starters." },
      { q: "Is live support included?", a: "Yes. You'll get weekly live Q&A sessions and a private community with mentor presence." },
    ],
  };
}
