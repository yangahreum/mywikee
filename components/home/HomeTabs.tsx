const TABS = ["Recently edited", "Starred", "Created by me", "All pages"] as const;

export function HomeTabs() {
  return (
    <div className="mb-7 flex gap-[26px] border-b border-border">
      {TABS.map((label) => {
        const active = label === "Recently edited";
        return (
          <span
            key={label}
            aria-current={active ? "page" : undefined}
            className={[
              "-mb-px px-px pb-3 text-[13px]",
              active
                ? "border-b-2 border-primary font-semibold text-ink"
                : "cursor-default text-ink-muted",
            ].join(" ")}
            title={active ? undefined : "곧 제공"}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
