import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommentSection } from "@/components/blog/CommentSection";
import { fetchBlogPost } from "@/lib/services";
import { formatDate } from "@/lib/format";
import type { BlogPost } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    return await fetchBlogPost(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    image: post.coverImage,
    datePublished: post.publishedAt,
    author: { "@type": "Organization", name: post.author },
  };

  return (
    <article className="container-page max-w-3xl py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/blog" className="text-sm font-semibold text-primary">
        ← Back to blog
      </Link>

      {post.category && (
        <span className="badge mt-4 inline-block bg-primary/10 text-primary">
          {post.category.name}
        </span>
      )}
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-secondary dark:text-white sm:text-4xl">
        {post.title}
      </h1>
      <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
        {post.author} · {formatDate(post.publishedAt)} · {post.readingMinutes} min
        read
      </p>

      {post.coverImage && (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-800">
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <div className="prose mt-8 max-w-none text-lg leading-relaxed text-slate-700 dark:text-slate-300">
        {post.body?.split("\n").map((para, i) => (
          <p key={i} className="mb-4">
            {para}
          </p>
        ))}
      </div>

      {post.tags && post.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag.id}
              className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      <CommentSection slug={post.slug} initialComments={post.comments ?? []} />

      {post.related && post.related.length > 0 && (
        <div className="mt-14">
          <h2 className="text-xl font-bold text-secondary dark:text-white">
            Related articles
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {post.related.map((rp) => (
              <Link
                key={rp.id}
                href={`/blog/${rp.slug}`}
                className="card p-4 hover:border-primary"
              >
                <p className="line-clamp-2 font-semibold text-secondary dark:text-white">
                  {rp.title}
                </p>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {rp.readingMinutes} min read
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
