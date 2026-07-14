"use client";

import { useState } from "react";

import { apiErrorMessage } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { addBlogComment } from "@/lib/services";
import type { BlogComment } from "@/lib/types";

export function CommentSection({
  slug,
  initialComments,
}: {
  slug: string;
  initialComments: BlogComment[];
}) {
  const [comments, setComments] = useState<BlogComment[]>(initialComments);
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const comment = await addBlogComment(slug, { author, body });
      setComments((prev) => [...prev, comment]);
      setAuthor("");
      setBody("");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-14 border-t border-slate-200 pt-8 dark:border-slate-800">
      <h2 className="text-xl font-bold text-secondary dark:text-white">
        Comments ({comments.length})
      </h2>

      <div className="mt-6 space-y-4">
        {comments.map((c) => (
          <div key={c.id} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-secondary dark:text-white">
                {c.author}
              </p>
              <span className="text-xs text-slate-400">
                {formatDate(c.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {c.body}
            </p>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Be the first to comment.
          </p>
        )}
      </div>

      <form onSubmit={submit} className="card mt-6 space-y-3 p-5">
        <input
          className="input"
          placeholder="Your name"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <textarea
          className="input min-h-[100px]"
          placeholder="Write a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Posting…" : "Post comment"}
        </button>
      </form>
    </section>
  );
}
