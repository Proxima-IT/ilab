import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, AlertCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { fetchPosts, type BlogPost } from "@/services/blog";

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

function applyBlogSeo(posts: BlogPost[]) {
  const title = "Blog - Mobile Repairing Tips & Career Guides | iLab BD";
  const description =
    "Read iLab BD blog articles, mobile repairing tips, career guides, and practical learning resources.";
  const image = posts[0]?.cover || `${window.location.origin}/og-image.jpg`;

  document.title = title;
  setMeta("description", description);
  setMeta("robots", "index,follow");
  setMeta("og:type", "website", true);
  setMeta("og:title", title, true);
  setMeta("og:description", description, true);
  setMeta("og:image", image, true);
  setMeta("og:url", window.location.href, true);
  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
  setMeta("twitter:image", image);
}

export default function BlogIndex() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    fetchPosts()
      .then((items) => {
        if (!alive) return;
        setPosts(items);
        applyBlogSeo(items);
      })
      .catch(() => {
        if (!alive) return;
        setError("Could not load blog posts. Please try again.");
        applyBlogSeo([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden pt-32 pb-20 bg-gradient-to-b from-surface to-background">
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-dark">iLab Blog</p>
          <h1 className="mt-3 text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            Mobile repairing tips and career guides
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Practical articles from iLab for learners, technicians, and future entrepreneurs.
          </p>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-96 rounded-2xl bg-card animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
              <AlertCircle className="mx-auto mb-2 h-5 w-5" />
              {error}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">
              No published blog posts are available right now.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, index) => (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
                  className="group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-card hover:-translate-y-1 transition-all"
                >
                  <Link to={`/blog/${post.slug}`} className="block aspect-[16/10] overflow-hidden">
                    <img
                      src={post.cover}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary-dark font-semibold">
                        {post.category}
                      </span>
                      {post.date && <span>{post.date}</span>}
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="mt-3 block text-lg font-bold text-foreground group-hover:text-primary-dark transition-colors"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent hover:gap-2 transition-all"
                    >
                      Read article <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
