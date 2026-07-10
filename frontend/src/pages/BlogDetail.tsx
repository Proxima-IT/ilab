import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, UserRound } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { fetchPostBySlug, fetchPosts, type BlogPost } from "@/services/blog";
import { applyJsonLd, applySeo, breadcrumbSchema, siteUrl } from "@/lib/seo";
import { renderBlogContent } from "@/lib/blog-bbcode";

function applyPostSeo(post: BlogPost) {
  applySeo({
    title: post.metaTitle,
    description: post.metaDescription,
    path: `/blog/${post.slug}`,
    image: post.cover,
    type: "article",
  });
  applyJsonLd("page-json-ld", [
    breadcrumbSchema([
      { name: "Home", url: siteUrl("/") },
      { name: "Blog", url: siteUrl("/blog") },
      { name: post.title, url: siteUrl(`/blog/${post.slug}`) },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description: post.metaDescription,
      image: post.cover,
      url: siteUrl(`/blog/${post.slug}`),
      author: {
        "@type": "Person",
        name: post.author.name,
      },
      publisher: {
        "@type": "Organization",
        name: "iLab BD",
        logo: {
          "@type": "ImageObject",
          url: siteUrl("/storage/website/ilab_ico.png"),
        },
      },
      mainEntityOfPage: siteUrl(`/blog/${post.slug}`),
    },
  ]);
}

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

    Promise.all([fetchPostBySlug(slug), fetchPosts()])
      .then(([postResponse, allPosts]) => {
        if (cancelled) return;

        if (!postResponse) {
          setError(true);
          return;
        }

        setPost(postResponse);
        setRelated(allPosts.filter((item) => item.slug !== slug).slice(0, 2));
        applyPostSeo(postResponse);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="pt-32 pb-20">
          <div className="mx-auto max-w-4xl px-4">
            <div className="h-96 rounded-3xl bg-card animate-pulse" />
          </div>
        </section>
      </main>
    );
  }

  if (error || !post) {
    return (
      <main className="min-h-screen grid place-items-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Article not found</h1>
          <Link to="/blog" className="mt-4 inline-block text-primary font-semibold">
            Back to blog
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <article className="pt-28 pb-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All posts
          </Link>

          <motion.header
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-primary/10 text-primary-dark px-3 py-1.5 text-xs font-bold">
                {post.category}
              </span>
              {post.date && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" /> {post.date}
                </span>
              )}
            </div>
            <h1 className="mt-5 text-3xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
              {post.title}
            </h1>
            <p className="mt-5 max-w-3xl text-lg md:text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>

            <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-border bg-card px-3 py-2 shadow-sm">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt={post.author.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="h-5 w-5" />
                </span>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Written by</p>
                <p className="text-sm font-bold text-foreground">{post.author.name}</p>
              </div>
            </div>
          </motion.header>
        </div>

        <div className="mt-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <img src={post.cover} alt={post.title} className="aspect-[16/9] w-full rounded-2xl object-cover shadow-card md:rounded-3xl" />
        </div>

        <div className="mt-12 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            {renderBlogContent(post.content)}
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="py-16 bg-surface">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground">Keep reading</h2>
            <div className="mt-6 grid md:grid-cols-2 gap-6">
              {related.map((item) => (
                <Link
                  key={item.slug}
                  to={`/blog/${item.slug}`}
                  className="group rounded-2xl overflow-hidden bg-card border border-border hover:shadow-card hover:-translate-y-1 transition-all flex"
                >
                  <img src={item.cover} alt="" className="h-32 w-40 object-cover shrink-0 group-hover:scale-105 transition-transform duration-500" />
                  <div className="p-5 min-w-0">
                    <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider">{item.category}</p>
                    <p className="mt-1.5 font-bold text-foreground line-clamp-2">{item.title}</p>
                    {item.date && <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>}
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
