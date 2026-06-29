import { Star } from "lucide-react";

export function Starred() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-[7px] text-[13px] font-semibold">
        <Star size={15} strokeWidth={1.7} className="text-star" /> Starred
      </div>
      <p className="m-0 py-2 text-[12px] text-ink-faint">
        즐겨찾기한 문서가 여기에 표시됩니다.
      </p>
    </div>
  );
}
