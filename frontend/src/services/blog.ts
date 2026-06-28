// Mock blog data + service. Swap with API later.
export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  cover: string;
  author: { name: string; avatar: string };
  content: string[]; // paragraphs
};

const RAW: Omit<BlogPost, "slug">[] = [
  {
    title: "How to land your first developer job in 2026",
    excerpt: "A field-tested 90-day plan to break into your first developer role — from portfolio to interview.",
    category: "Career",
    date: "Jun 10, 2026",
    readTime: "6 min read",
    cover: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=1600&q=80",
    author: { name: "Rahim Hossain", avatar: "https://i.pravatar.cc/120?img=12" },
    content: [
      "Breaking into your first developer job feels impossible until it suddenly isn't. The single biggest predictor of success isn't talent — it's a focused 90-day plan executed with consistency.",
      "Week 1–4: stop tutorial-hopping. Pick one stack and ship one small project end-to-end. A working CRUD app with auth and deploy is worth more than three half-finished clones.",
      "Week 5–8: rebuild your portfolio around outcomes, not technologies. Each project should answer: what did it do, who used it, and what changed because of it.",
      "Week 9–12: apply daily, even when underqualified. Pair every application with a personal note to a human at the company. Most replies happen there, not in the inbox of a recruiter.",
    ],
  },
  {
    title: "The complete roadmap to becoming a data scientist",
    excerpt: "Math, Python, SQL, ML — the order to learn them in and the traps to avoid.",
    category: "Data Science",
    date: "Jun 4, 2026",
    readTime: "9 min read",
    cover: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1600&q=80",
    author: { name: "Dr. Tahmina Ahmed", avatar: "https://i.pravatar.cc/120?img=32" },
    content: [
      "Data science is a moving target, but the foundations don't change: probability, linear algebra, Python, SQL, and the ability to communicate what you found.",
      "Start with SQL and pandas. 80% of real data work is reshaping and joining — model training is the cherry on top.",
      "Then learn one ML library well. Scikit-learn is the right first choice. Don't jump to deep learning until you can explain bias, variance and leakage in plain language.",
      "Finish every project with a one-page write-up. Hiring managers read write-ups; they rarely run notebooks.",
    ],
  },
  {
    title: "Design systems: building scalable UI at scale",
    excerpt: "What makes a design system actually get adopted — beyond the pretty docs site.",
    category: "Design",
    date: "May 28, 2026",
    readTime: "7 min read",
    cover: "https://images.unsplash.com/photo-1545235617-9465d2a55698?auto=format&fit=crop&w=1600&q=80",
    author: { name: "Nabila Karim", avatar: "https://i.pravatar.cc/120?img=47" },
    content: [
      "Most design systems fail not because the components are wrong, but because adoption was never designed for. Treat the system as a product with users — your designers and engineers.",
      "Ship tokens before components. A shared color, spacing and typography vocabulary unlocks 60% of the value with 5% of the effort.",
      "Pair every component with a single example app. People copy from working code, not from Storybook controls.",
      "Measure adoption monthly. If usage isn't growing, the system isn't earning its keep.",
    ],
  },
  {
    title: "From bootcamp to senior — the skills nobody teaches",
    excerpt: "Communication, scoping, and saying no — the actual skills that move levels.",
    category: "Career",
    date: "May 18, 2026",
    readTime: "5 min read",
    cover: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
    author: { name: "Mehedi Hasan", avatar: "https://i.pravatar.cc/120?img=68" },
    content: [
      "After your first promotion, technical skill stops being the bottleneck. Scoping, communication, and judgment do.",
      "Write more than you think you need to. A clear written proposal beats a charismatic meeting every time.",
      "Senior is mostly the courage to say 'this isn't worth doing' and back it up with one paragraph.",
    ],
  },
];

export const POSTS: BlogPost[] = RAW.map((p) => ({
  ...p,
  slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
}));

export async function fetchPosts(): Promise<BlogPost[]> {
  await new Promise((r) => setTimeout(r, 100));
  return POSTS;
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  await new Promise((r) => setTimeout(r, 100));
  return POSTS.find((p) => p.slug === slug) ?? null;
}
