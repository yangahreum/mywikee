import Link from "next/link";
import { FileText } from "lucide-react";
import type { DashboardDoc } from "@/lib/home/types";
import { relativeTime } from "@/lib/format/relative-time";

type Props = { docs: DashboardDoc[]; now: Date };

const COLS = "grid grid-cols-[1fr_116px_108px] gap-3";

export function RecentlyEditedTable({ docs, now }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className={`${COLS} border-b border-border bg-surface-alt px-[18px] py-[11px] text-[10px] font-semibold tracking-[0.07em] text-ink-faint`}>
        <div>NAME</div>
        <div>TAG</div>
        <div className="text-right">UPDATED</div>
      </div>

      {docs.length === 0 ? (
        <div className="px-[18px] py-8 text-center text-[13px] text-ink-secondary">
          아직 문서가 없어요. 첫 문서를 만들어보세요.
        </div>
      ) : (
        docs.map((d, i) => (
          <Link
            key={d.id}
            href={`/edit/${d.id}`}
            className={`${COLS} items-center px-[18px] py-[13px] ${i < docs.length - 1 ? "border-b border-border-2" : ""}`}
          >
            <div className="flex min-w-0 items-center gap-[11px]">
              <FileText size={16} strokeWidth={1.7} className="flex-shrink-0 text-ink-muted" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-ink">
                  {d.title || "제목 없는 문서"}
                </div>
                {d.project && (
                  <div className="text-[11px] text-ink-faint">
                    Knowledge Base / {d.project}
                  </div>
                )}
              </div>
            </div>
            <div>
              {d.project && (
                <span className="rounded-[5px] bg-chip px-2 py-[3px] text-[9.5px] font-semibold tracking-[0.05em] text-chip-ink">
                  {d.project.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <span className="text-[11.5px] text-ink-faint">{relativeTime(d.updatedAt, now)}</span>
              <span className="h-[22px] w-[22px] rounded-full bg-border-strong" aria-hidden />
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
