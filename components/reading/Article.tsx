import Link from "next/link";
import { PenLine } from "lucide-react";

type Props = {
  title: string;
  breadcrumb: string[];
  html: string; // sanitized + toc id 주입됨
  author: string;
  updatedLabel: string;
  readingMin: number;
  editHref?: string;
};

export function Article({ title, breadcrumb, html, author, updatedLabel, readingMin, editHref }: Props) {
  return (
    <article className="min-w-0 flex-1">
      <div className="mb-4 text-[11.5px] text-ink-faint">
        {breadcrumb.join(" / ")}{breadcrumb.length ? " / " : ""}
        <span className="font-semibold text-ink-secondary">{title}</span>
      </div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="m-0 font-serif text-[38px] font-semibold leading-[1.12] tracking-[-0.02em]">{title}</h1>
        {editHref && (
          <Link
            href={editHref}
            className="mt-2 flex h-[34px] flex-shrink-0 items-center gap-1.5 rounded-md border border-border-input bg-surface px-4 text-[12.5px] font-medium text-ink"
          >
            <PenLine size={14} strokeWidth={1.8} /> Edit
          </Link>
        )}
      </div>
      <div className="prose-reading" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="mt-7 flex items-center justify-between border-t border-border-strong pt-5">
        <div className="flex items-center gap-2.5">
          <div className="h-[34px] w-[34px] rounded-full bg-border-strong" aria-hidden />
          <div className="text-[12.5px] font-semibold">{author}</div>
        </div>
        <div className="text-right text-[11px] leading-relaxed text-ink-faint">
          Last edited: {updatedLabel}<br />Reading time: {readingMin} min
        </div>
      </div>
    </article>
  );
}
