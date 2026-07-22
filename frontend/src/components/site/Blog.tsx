import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { fetchPosts, type BlogPost } from "@/services/blog";

export function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    let alive = true;

    fetchPosts()
      .then((items) => {
        if (alive) setPosts(items.slice(0, 3));
      })
      .catch(() => {
        if (alive) setPosts([]);
      });

    return () => {
      alive = false;
    };
  }, []);

  return (
    <section id="blog" className="py-20 md:py-28 bg-surface">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-base font-semibold text-primary uppercase tracking-wider">From the Blog</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-foreground">
            Insights to keep you{" "}
            <span className="relative inline-block text-primary">
              growing
              <span className="absolute left-0 -bottom-1 h-1 w-full rounded-full bg-primary/70" />
            </span>
          </h2>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2.5 px-7 py-3 rounded-full text-sm font-bold gradient-orange text-white shadow-orange-glow hover:scale-105 hover:shadow-lg transition-all"
          >
            View all posts <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {posts.length === 0
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="aspect-[16/22] rounded-2xl bg-card animate-pulse" />
              ))
            : posts.map((post, index) => (
                <motion.article
                  key={post.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="group flex h-full flex-col rounded-2xl overflow-hidden bg-card border border-border hover:shadow-card hover:-translate-y-1 transition-all"
                >
                  <Link to={`/blog/${post.slug}`} className="block aspect-[16/10] overflow-hidden">
                    <img
                      src={post.cover}
                      alt={post.title}
                      loading="lazy"
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary-dark font-semibold">
                        {post.category}
                      </span>
                      {post.date && <span>{post.date}</span>}
                    </div>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="mt-3 block text-lg font-bold text-foreground group-hover:text-primary-dark transition-colors line-clamp-2"
                    >
                      {post.title}
                    </Link>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
                    <div className="mt-auto pt-5 flex justify-center">
                      <Link
                        to={`/blog/${post.slug}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold gradient-orange text-white shadow-orange-glow hover:scale-105 transition-transform"
                      >
                        Read Now <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
        </div>
      </div>
    </section>
  );
}
