import { History } from "lucide-react";
import type { DashboardDoc } from "@/lib/home/types";
import { relativeTime } from "@/lib/format/relative-time";

type Props = { docs: DashboardDoc[]; now: Date };

export function RecentActivity({ docs, now }: Props) {
  const items = docs.slice(0, 3);
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3.5 flex items-center gap-[7px] text-[13px] font-semibold">
        <History size={15} strokeWidth={1.7} className="text-ink-secondary" /> Recent activity
      </div>
      {items.length === 0 ? (
        <p className="m-0 text-[12px] text-ink-faint">최근 활동이 없습니다.</p>
      ) : (
        items.map((d, i) => (
          <div
            key={d.id}
            className={`flex gap-[11px] ${i < items.length - 1 ? "border-b border-border-2 pb-3" : ""} ${i > 0 ? "pt-3" : ""}`}
          >
            <span
              className={`mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${i === 0 ? "bg-[#3a4a78]" : "bg-[#c3c8d1]"}`}
            />
            <div>
              <div className="text-[12.5px] font-medium leading-snug text-ink">
                Updated &quot;{d.title || "제목 없는 문서"}&quot;
              </div>
              <div className="mt-0.5 text-[11px] text-ink-faint">
                {relativeTime(d.updatedAt, now)}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
