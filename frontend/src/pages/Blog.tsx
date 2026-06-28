import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { fetchPosts, type BlogPost } from "@/services/blog";
import { useEffect, useState } from "react";

export default function BlogIndex() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Blog — Mobile Repairing Tips & Career Guides | iLab BD";
    fetchPosts().then((res) => {
      setPosts(res);
      setLoading(false);
    });
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden pt-32 pb-20 bg-gradient-to-b from-surface to-background">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-dark">iLab Blog</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            Insights to keep you growing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Career playbooks, technical deep-dives and stories from the iLab community.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p, i) => (
            <motion.article
              key={p.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: Math.min(i, 8) * 0.04 }}
              className="group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-card hover:-translate-y-1 transition-all"
            >
              <Link to="/blog/$slug" params={{ slug: p.slug }} className="block aspect-[16/10] overflow-hidden">
                <img src={p.cover} alt={p.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </Link>
              <div className="p-6">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary-dark font-semibold">{p.category}</span>
                  <span>{p.date}</span>
                  <span>·</span>
                  <span>{p.readTime}</span>
                </div>
                <Link to="/blog/$slug" params={{ slug: p.slug }} className="mt-3 block text-lg font-bold text-foreground group-hover:text-primary-dark transition-colors">
                  {p.title}
                </Link>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{p.excerpt}</p>
                <Link to="/blog/$slug" params={{ slug: p.slug }} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:gap-2 transition-all">
                  Read article <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
