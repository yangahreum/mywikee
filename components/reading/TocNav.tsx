"use client";
import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/render/toc";

type Props = { items: TocItem[]; relatedTitles: string[] };

export function TocNav({ items, relatedTitles }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    for (const it of items) {
      const el = document.getElementById(it.id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [items]);

  return (
    <aside className="w-[172px] flex-shrink-0 sticky top-0 self-start">
      {items.length > 0 && (
        <>
          <div className="mb-3.5 text-[10px] font-semibold tracking-[0.09em] text-ink-faint">ON THIS PAGE</div>
          <div className="mb-7 flex flex-col gap-[11px] border-l border-border-strong pl-3.5 text-[12.5px]">
            {items.map((it) => {
              const active = it.id === activeId;
              return (
                <a
                  key={it.id}
                  href={`#${it.id}`}
                  style={{ paddingLeft: it.level === 3 ? 10 : 0 }}
                  className={`relative ${active ? "font-semibold text-ink" : "text-ink-muted"}`}
                >
                  {active && <span className="absolute -left-[15px] top-0.5 bottom-0.5 w-0.5 bg-primary" />}
                  {it.text}
                </a>
              );
            })}
          </div>
        </>
      )}
      {relatedTitles.length > 0 && (
        <>
          <div className="mb-3.5 text-[10px] font-semibold tracking-[0.09em] text-ink-faint">RELATED PAGES</div>
          <div className="flex flex-col gap-[11px] text-[12.5px] text-ink-secondary">
            {relatedTitles.map((t) => <span key={t}>{t}</span>)}
          </div>
        </>
      )}
    </aside>
  );
}
