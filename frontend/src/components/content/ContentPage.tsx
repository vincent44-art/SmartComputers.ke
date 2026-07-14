import type { ReactNode } from "react";

export function ContentPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-secondary dark:text-white sm:text-4xl">
        {title}
      </h1>
      {intro && (
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">{intro}</p>
      )}
      <div className="prose mt-8 max-w-none space-y-6 text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-secondary dark:text-white">
        {heading}
      </h2>
      <div className="mt-2 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}
