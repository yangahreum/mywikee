import { Search, Settings } from "lucide-react";

type Props = {
  searchPlaceholder: string;
};

const TOP_NAV = [
  { label: "Explorer", enabled: true },
  { label: "Graphs", enabled: false },
  { label: "Templates", enabled: false },
];

export function Topbar({ searchPlaceholder }: Props) {
  return (
    <div className="flex h-[54px] flex-shrink-0 items-center gap-6 border-b border-border bg-surface px-7">
      {/* quick find */}
      <div className="flex h-8 w-60 items-center gap-2 rounded-md bg-[#f4f5f7] px-3 text-[12.5px] text-ink-faint">
        <Search size={14} strokeWidth={1.9} /> {searchPlaceholder}
      </div>
      <div className="flex-1" />
      {/* top nav */}
      <nav className="flex gap-[22px] text-[13px]">
        {TOP_NAV.map((n) => (
          <span
            key={n.label}
            aria-disabled={n.enabled ? undefined : "true"}
            className={
              n.enabled
                ? "font-semibold text-ink"
                : "cursor-default text-ink-faint"
            }
            title={n.enabled ? undefined : "곧 제공"}
          >
            {n.label}
          </span>
        ))}
      </nav>
      <Settings size={17} strokeWidth={1.7} className="text-ink-secondary" />
      <div className="h-7 w-7 rounded-full bg-border-strong" aria-hidden />
      {/* publish placeholder (S4 에서 활성) */}
      <button
        type="button"
        disabled
        title="S4 에서 제공"
        className="h-[34px] rounded-md bg-primary px-[18px] text-[12.5px] font-medium text-primary-fg opacity-50"
      >
        Publish
      </button>
    </div>
  );
}
