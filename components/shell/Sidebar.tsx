import Link from "next/link";
import { Plus } from "lucide-react";
import { NAV_ITEMS, isActiveNav } from "@/lib/shell/nav";

type Props = {
  pathname: string;
  userSlot: React.ReactNode;
  /** 사이드바 너비 px (홈 228, 읽기·편집 212). 기본 228. */
  width?: number;
};

export function Sidebar({ pathname, userSlot, width = 228 }: Props) {
  return (
    <aside
      style={{ width }}
      className="flex flex-shrink-0 flex-col border-r border-border bg-surface px-3.5 py-5"
    >
      {/* 브랜드 */}
      <div className="px-1.5 pb-4">
        <div className="font-serif text-[17px] font-semibold tracking-tight">
          Digital Sanctuary
        </div>
        <div className="mt-0.5 text-[11px] text-ink-muted">Personal Wiki</div>
      </div>

      {/* 주 버튼 */}
      <Link
        href="/me"
        className="flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-[13px] font-medium text-primary-fg"
      >
        <Plus size={15} strokeWidth={2.2} /> New Entry
      </Link>

      {/* 네비 */}
      <nav className="mt-4 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActiveNav(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "relative flex h-9 items-center gap-3 rounded-md px-3 text-[13.5px]",
                active
                  ? "bg-chip font-medium text-ink"
                  : "text-ink-secondary",
              ].join(" ")}
            >
              {active && (
                <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded bg-primary" />
              )}
              <Icon size={17} strokeWidth={1.7} /> {item.label}
            </Link>
          );
        })}
      </nav>

      {/* 하단: 사용자 슬롯 */}
      <div className="mt-auto">{userSlot}</div>
    </aside>
  );
}
