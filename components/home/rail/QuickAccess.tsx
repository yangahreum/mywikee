import { GitFork, BookOpen, PenTool, Database, ChevronRight, type LucideIcon } from "lucide-react";

const ITEMS: { label: string; icon: LucideIcon }[] = [
  { label: "Global Graph", icon: GitFork },
  { label: "Reading Queue", icon: BookOpen },
  { label: "Canvas Mode", icon: PenTool },
  { label: "Collections", icon: Database },
];

export function QuickAccess() {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 text-[13px] font-semibold">Quick access</div>
      {ITEMS.map(({ label, icon: Icon }) => (
        <div
          key={label}
          aria-disabled="true"
          title="곧 제공"
          className="flex h-9 cursor-default items-center gap-[11px] text-[12.5px] text-ink-2"
        >
          <Icon size={15} strokeWidth={1.7} className="text-ink-secondary" />
          {label}
          <ChevronRight size={14} strokeWidth={1.8} className="ml-auto text-[#c3c8d1]" />
        </div>
      ))}
    </div>
  );
}
