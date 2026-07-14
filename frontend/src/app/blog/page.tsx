import Image from "next/image";
import Link from "next/link";

import { SectionHeader } from "@/components/ui/SectionHeader";
import { fetchBlogCategories, fetchBlogPosts } from "@/lib/services";
import { formatDate } from "@/lib/format";
import type { BlogCategory, BlogPost } from "@/lib/types";

export const revalidate = 300;

export const metadata = {
  title: "Blog — Tech Guides, Reviews & Tips",
  description:
    "Buying guides, product reviews and tech tips from the SmartComputers.ke team.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  let posts: BlogPost[] = [];
  let categories: BlogCategory[] = [];
  try {
    const [postsRes, cats] = await Promise.all([
      fetchBlogPosts({ page: 1 }),
      fetchBlogCategories(),
    ]);
    posts = postsRes.items;
    categories = cats;
  } catch {
    /* backend unavailable at build time */
  }

  const [featured, ...rest] = posts;

  return (
    <div className="container-page py-10">
      <SectionHeader
        title="SmartComputers Blog"
        subtitle="Buying guides, reviews and tech tips"
      />

      {categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link href="/blog" className="badge bg-primary text-white">
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/blog?category=${c.slug}`}
              className="badge bg-slate-100 text-secondary hover:bg-primary hover:text-white dark:bg-slate-800 dark:text-slate-200"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {featured && (
        <Link
          href={`/blog/${featured.slug}`}
          className="card group mb-10 grid gap-6 overflow-hidden md:grid-cols-2"
        >
          <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800">
            {featured.coverImage && (
              <Image
                src={featured.coverImage}
                alt={featured.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            )}
          </div>
          <div className="flex flex-col justify-center p-6">
            {featured.category && (
              <span className="badge w-fit bg-primary/10 text-primary">
                {featured.category.name}
              </span>
            )}
            <h2 className="mt-3 text-2xl font-bold text-secondary group-hover:text-primary dark:text-white">
              {featured.title}
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {featured.excerpt}
            </p>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              {featured.author} · {formatDate(featured.publishedAt)} ·{" "}
              {featured.readingMinutes} min read
            </p>
          </div>
        </Link>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="card group flex flex-col overflow-hidden"
          >
            <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800">
              {post.coverImage && (
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              {post.category && (
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {post.category.name}
                </span>
              )}
              <h3 className="mt-1 line-clamp-2 font-bold text-secondary group-hover:text-primary dark:text-white">
                {post.title}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                {post.excerpt}
              </p>
              <p className="mt-auto pt-4 text-xs text-slate-500 dark:text-slate-400">
                {formatDate(post.publishedAt)} · {post.readingMinutes} min read
              </p>
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="card grid place-items-center p-16 text-center">
          <p className="text-slate-500 dark:text-slate-400">
            No blog posts yet. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
