import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight, AlertCircle, Calendar, Newspaper } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { fetchPosts, type BlogPost } from "@/services/blog";
import { applyJsonLd, applySeo, breadcrumbSchema, siteUrl } from "@/lib/seo";

function applyBlogSeo(posts: BlogPost[]) {
  const title = "Blog - Mobile Repairing Tips & Career Guides | iLab BD";
  const description =
    "Read iLab BD blog articles, mobile repairing tips, career guides, and practical learning resources.";
  const image = posts[0]?.cover || null;

  applySeo({ title, description, path: "/blog", image });
  applyJsonLd("page-json-ld", [
    breadcrumbSchema([
      { name: "Home", url: siteUrl("/") },
      { name: "Blog", url: siteUrl("/blog") },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: title,
      description,
      url: siteUrl("/blog"),
      mainEntity: {
        "@type": "ItemList",
        itemListElement: posts.map((post, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: siteUrl(`/blog/${post.slug}`),
          name: post.title,
        })),
      },
    },
  ]);
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

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <section className="relative overflow-hidden border-b border-border bg-surface pt-32 pb-14 md:pb-18">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary-dark">
              <Newspaper className="h-4 w-4" />
              iLab Blog
            </div>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-foreground md:text-6xl">
              Mobile repairing tips and career guides
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Practical articles from iLab for learners, technicians, and future entrepreneurs.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
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
            <div className="space-y-10">
              {featuredPost && (
                <motion.article
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="grid overflow-hidden rounded-2xl border border-border bg-card shadow-card lg:grid-cols-[1.1fr_0.9fr]"
                >
                  <Link to={`/blog/${featuredPost.slug}`} className="block min-h-[260px] overflow-hidden sm:min-h-[360px] lg:min-h-full">
                    <img
                      src={featuredPost.cover}
                      alt={featuredPost.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </Link>
                  <div className="flex flex-col justify-center p-6 md:p-9">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="rounded-full bg-primary/10 px-3 py-1.5 font-bold text-primary-dark">
                        {featuredPost.category}
                      </span>
                      {featuredPost.date && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" /> {featuredPost.date}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/blog/${featuredPost.slug}`}
                      className="mt-4 block text-2xl font-extrabold leading-tight text-foreground transition-colors hover:text-primary-dark md:text-4xl"
                    >
                      {featuredPost.title}
                    </Link>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">{featuredPost.excerpt}</p>
                    <Link
                      to={`/blog/${featuredPost.slug}`}
                      className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
                    >
                      Read article <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.article>
              )}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {remainingPosts.map((post, index) => (
                  <motion.article
                    key={post.slug}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
                    className="group overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-card"
                  >
                    <Link to={`/blog/${post.slug}`} className="block aspect-[16/10] overflow-hidden">
                      <img
                        src={post.cover}
                        alt={post.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>
                    <div className="p-6">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary-dark">
                          {post.category}
                        </span>
                        {post.date && <span>{post.date}</span>}
                      </div>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="mt-3 block text-lg font-bold text-foreground transition-colors group-hover:text-primary-dark"
                      >
                        {post.title}
                      </Link>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent transition-all hover:gap-2"
                      >
                        Read article <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
