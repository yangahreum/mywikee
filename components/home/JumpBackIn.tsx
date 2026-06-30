import Link from "next/link";
import { FileText } from "lucide-react";
import type { DashboardDoc } from "@/lib/home/types";
import { relativeTime } from "@/lib/format/relative-time";

type Props = { docs: DashboardDoc[]; now: Date };

export function JumpBackIn({ docs, now }: Props) {
  if (docs.length === 0) return null;
  return (
    <section className="mb-9">
      <div className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-ink-faint">
        JUMP BACK IN
      </div>
      <div className="grid grid-cols-4 gap-3.5">
        {docs.slice(0, 4).map((d) => (
          <Link
            key={d.id}
            href={`/p/${d.slug}`}
            className="rounded-[10px] border border-border bg-surface px-4 pb-4 pt-[15px]"
          >
            <div className="mb-6 flex h-8 w-8 items-center justify-center rounded-lg bg-chip-2 text-ink-secondary">
              <FileText size={16} strokeWidth={1.7} />
            </div>
            <div className="text-[13px] font-semibold leading-tight text-ink">
              {d.title || "제목 없는 문서"}
            </div>
            <div className="mt-1 text-[11px] text-ink-faint">
              {d.project || "Knowledge Base"} · Edited {relativeTime(d.updatedAt, now)}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
