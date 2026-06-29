import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { fetchPostBySlug, fetchPosts, type BlogPost } from "@/services/blog";
import { useEffect, useState } from "react";

export default function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [related, setRelated] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(false);

    Promise.all([
      fetchPostBySlug(slug),
      fetchPosts()
    ]).then(([postRes, allRes]) => {
      if (cancelled) return;
      if (!postRes) {
        setError(true);
        setLoading(false);
        return;
      }
      setPost(postRes);
      setRelated(allRes.filter((p) => p.slug !== slug).slice(0, 2));
      setLoading(false);
      document.title = `${postRes.title} — iLab BD Blog`;
    }).catch(() => {
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen grid place-items-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Article not found</h1>
          <Link to="/blog" className="mt-4 inline-block text-primary font-semibold">Back to blog →</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <article className="pt-28 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>

          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6"
          >
            <span className="rounded-full bg-primary/10 text-primary-dark px-2.5 py-1 text-xs font-semibold">{post.category}</span>
            <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>

            <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
              <img src={post.author.avatar} alt={post.author.name} className="h-9 w-9 rounded-full object-cover" />
              <span className="font-semibold text-foreground">{post.author.name}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {post.date}</span>
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {post.readTime}</span>
            </div>
          </motion.header>
        </div>

        <div className="mt-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <img src={post.cover} alt={post.title} className="rounded-3xl aspect-[16/8] w-full object-cover shadow-card" />
        </div>

        <div className="mt-12 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-6">
          {post.content.map((p, i) => (
            <p key={i} className="text-lg leading-relaxed text-foreground/90">{p}</p>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="py-16 bg-surface">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Keep reading</h2>
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-card hover:-translate-y-1 transition-all flex"
                >
                  <img src={p.cover} alt="" className="h-32 w-40 object-cover shrink-0 group-hover:scale-105 transition-transform duration-500" />
                  <div className="p-5 min-w-0">
                    <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider">{p.category}</p>
                    <p className="mt-1.5 font-bold text-foreground line-clamp-2">{p.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{p.readTime}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}
