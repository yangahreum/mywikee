# S2 — 홈 대시보드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 로그인 직후의 워크스페이스 홈(`/`)을 청사진 Frame 1과 픽셀에 가깝게 구현한다 — 페이지 헤더·탭·Jump back in 카드·Recently edited 테이블·우측 레일(Starred/Recent activity/Quick access). 실데이터(문서 목록/카운트/최근)는 연결하고, 미구현 데이터(태그/즐겨찾기)는 placeholder/빈 상태로 둔다.

**Architecture:** 데이터는 `lib/home/get-dashboard.ts`(서버, `updated_at desc`)가 카운트+최근 N건을 반환. 상대시각은 `lib/format/relative-time.ts` 순수 함수. 화면은 `components/home/` 아래 작은 표현 컴포넌트로 쪼개고 각자 prop만 받는다(테스트 용이). `app/page.tsx`(서버)가 `getUser` 가드 → 데이터 조회 → `AppShell` 안에 대시보드를 조립.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind v4 + 토큰(S1), lucide-react, vitest + @testing-library/react + happy-dom.

---

## 배경 / 참고 스펙 (반드시 열어볼 것)

- **S2 설계**: `docs/superpowers/specs/2026-06-29-s2-home-dashboard-design.html` (픽셀·데이터 매핑)
- **마스터 스펙**: `docs/superpowers/specs/2026-06-29-ui-design-system-and-roadmap-design.html` (§6 토큰, §7.1 홈)
- **청사진 원본 (픽셀 진실)**: 사용자 제공 `Digital Sanctuary.dc.html`의 **FRAME 1: DASHBOARD** 블록. 각 컴포넌트 구현 시 이 블록의 인라인 스타일 값을 Tailwind 토큰 클래스로 변환한다. **임의 변형 금지.**

## 토큰 클래스 빠른 참조 (S1에서 정의됨, `app/globals.css @theme`)

색: `bg-app`(#f6f7f9) `bg-surface`(#fff) `bg-surface-alt`(#fafbfc) `text-ink`(#1b2430) `text-ink-secondary`(#5b6573) `text-ink-muted`(#8b94a3) `text-ink-faint`(#9aa2b1) `bg-primary`/`text-primary-fg` `border-border`(#ebedf1) `border-border-2`(#f0f1f4) `bg-chip`(#f1f2f5) `bg-chip-2`(#eef0f3) `text-chip-ink`(#6b7280) `bg-accent-soft`/`text-accent-soft-fg` `text-star`(#c9a23a). 폰트: `font-serif`(Newsreader) 기본 sans. radius: `rounded-md`(9) `rounded-lg`(12) 등.

> 청사진에만 있고 토큰에 없는 색(예: 점 불릿 `#3a4a78`/`#c3c8d1`, 검색 알약 `#f4f5f7`)은 arbitrary value(`bg-[#3a4a78]`)로 둔다 — S1 리뷰에서 합의된 처리.

## File Structure

| 파일 | 책임 |
|------|------|
| `lib/format/relative-time.ts` (+__tests__) | ISO → "2h ago" 류 상대시각 순수 함수 |
| `lib/home/get-dashboard.ts` | 서버 조회: 문서 총 개수 + 최근 N건(updated_at desc) |
| `lib/home/types.ts` | `DashboardDoc`, `DashboardData` 타입 |
| `components/home/PageHeader.tsx` | h1 Home + 메타 + New Page 버튼 |
| `components/home/HomeTabs.tsx` | 탭(Recently edited 활성 + 나머지 자리) |
| `components/home/JumpBackIn.tsx` | 4열 카드 |
| `components/home/RecentlyEditedTable.tsx` | 테이블(헤더+행+태그칩+빈상태) |
| `components/home/rail/Starred.tsx` | 우측 레일 — 빈 상태 |
| `components/home/rail/RecentActivity.tsx` | 우측 레일 — 최근 활동(파생) |
| `components/home/rail/QuickAccess.tsx` | 우측 레일 — 백로그 비활성 |
| `components/home/__tests__/*.test.tsx` | 각 컴포넌트 테스트 |
| `app/actions.ts` | `createDraftDocument` 이동(현 `app/me/actions.ts`) |
| `app/page.tsx` | 홈 대시보드 조립(서버) |
| `app/me/page.tsx` | `/`로 redirect |

---

## Task 1: 상대시각 순수 함수 (TDD)

**Files:** Create `lib/format/relative-time.ts`, Test `lib/format/__tests__/relative-time.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from "vitest";
import { relativeTime } from "@/lib/format/relative-time";

const NOW = new Date("2026-06-29T12:00:00Z");

describe("relativeTime", () => {
  // 스펙: 60초 미만은 "just now"
  it("방금 전은 just now", () => {
    expect(relativeTime("2026-06-29T11:59:30Z", NOW)).toBe("just now");
  });
  // 스펙: 분 단위 "Nm ago"
  it("분 단위", () => {
    expect(relativeTime("2026-06-29T11:45:00Z", NOW)).toBe("15m ago");
  });
  // 스펙: 시간 단위 "Nh ago"
  it("시간 단위", () => {
    expect(relativeTime("2026-06-29T10:00:00Z", NOW)).toBe("2h ago");
  });
  // 스펙: 일 단위 "Nd ago"
  it("일 단위", () => {
    expect(relativeTime("2026-06-27T12:00:00Z", NOW)).toBe("2d ago");
  });
  // 스펙: 미래 시각은 just now 로 방어(음수 표기 금지)
  it("미래는 just now", () => {
    expect(relativeTime("2026-06-29T12:05:00Z", NOW)).toBe("just now");
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `pnpm vitest run lib/format/__tests__/relative-time.test.ts` → FAIL (모듈 없음)

- [ ] **Step 3: 최소 구현**

```ts
/** ISO 시각 → "just now" | "Nm ago" | "Nh ago" | "Nd ago" (청사진 표기). 미래는 just now. */
export function relativeTime(iso: string, now: Date): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}
```

- [ ] **Step 4: 통과 확인** — Run 동일 → PASS (5 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/format/relative-time.ts lib/format/__tests__/relative-time.test.ts
git commit -m "feat(wiki): S2-1 상대시각 순수 함수"
```

> 표기는 청사진 충실을 위해 영어("2h ago"). 한글화 여부는 후속 검토(미해결).

---

## Task 2: 대시보드 조회 헬퍼

**Files:** Create `lib/home/types.ts`, `lib/home/get-dashboard.ts`, Test `lib/home/__tests__/get-dashboard.test.ts`

> 조회는 Supabase 의존이라 순수 단위 테스트가 어렵다. **반환 타입 shape과 매핑 로직만 테스트**하고, 실제 쿼리는 QA에서 검증한다. 이를 위해 매핑 함수를 분리한다.

- [ ] **Step 1: 타입 작성** — `lib/home/types.ts`

```ts
export type DashboardDoc = {
  id: string;
  title: string;
  project: string;
  updatedAt: string;
};

export type DashboardData = {
  totalCount: number;
  recent: DashboardDoc[];
};
```

- [ ] **Step 2: 실패 테스트 작성** (매핑 함수) — `lib/home/__tests__/get-dashboard.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { mapDashboardRow } from "@/lib/home/get-dashboard";

describe("mapDashboardRow", () => {
  // 스펙: DB row → DashboardDoc (snake → camel, null title/project 방어)
  it("row 를 DashboardDoc 으로 매핑한다", () => {
    expect(
      mapDashboardRow({
        id: "d1",
        title: "문서",
        project: "Research",
        updated_at: "2026-06-29T10:00:00Z",
      }),
    ).toEqual({
      id: "d1",
      title: "문서",
      project: "Research",
      updatedAt: "2026-06-29T10:00:00Z",
    });
  });
  // 스펙: title/project 가 null 이면 빈 문자열로
  it("null title/project 는 빈 문자열", () => {
    const r = mapDashboardRow({
      id: "d2",
      title: null,
      project: null,
      updated_at: "2026-06-29T10:00:00Z",
    });
    expect(r.title).toBe("");
    expect(r.project).toBe("");
  });
});
```

- [ ] **Step 3: 실패 확인** — Run: `pnpm vitest run lib/home/__tests__/get-dashboard.test.ts` → FAIL

- [ ] **Step 4: 구현** — `lib/home/get-dashboard.ts`

```ts
import { createClient } from "@/lib/supabase/server";
import type { DashboardData, DashboardDoc } from "./types";

type Row = {
  id: string;
  title: string | null;
  project: string | null;
  updated_at: string;
};

/** DB row → DashboardDoc. (단위 테스트 대상) */
export function mapDashboardRow(row: Row): DashboardDoc {
  return {
    id: row.id,
    title: row.title ?? "",
    project: row.project ?? "",
    updatedAt: row.updated_at,
  };
}

/** 홈 대시보드 데이터: 총 개수 + 최근 수정 N건(updated_at desc). */
export async function getDashboardData(
  ownerId: string,
  recentLimit = 8,
): Promise<DashboardData> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, project, updated_at")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(recentLimit);

  const recent = error || !data ? [] : data.map(mapDashboardRow);
  return { totalCount: count ?? 0, recent };
}
```

- [ ] **Step 5: 통과 확인** — Run 동일 → PASS (2 tests). 그리고 `pnpm tsc --noEmit`.

- [ ] **Step 6: 커밋**

```bash
git add lib/home/types.ts lib/home/get-dashboard.ts lib/home/__tests__/get-dashboard.test.ts
git commit -m "feat(wiki): S2-2 대시보드 조회 헬퍼(count + 최근 N건)"
```

---

## Task 3: PageHeader (TDD)

**Files:** Create `components/home/PageHeader.tsx`, Test `components/home/__tests__/PageHeader.test.tsx`

청사진 참조: dc.html Frame 1 "page header" 블록 — h1 `class="serif" font-size:30;font-weight:600;letter-spacing:-.02em`; 메타 `font-size:12.5px;color:#8b94a3`; New Page 버튼 `height:38;background:#182232;color:#fff;border-radius:9;font-size:12.5;font-weight:500` + `plus`(15, strokeWidth 2.2).

- [ ] **Step 1: 실패 테스트 작성**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/home/PageHeader";

describe("PageHeader", () => {
  // 스펙: 제목 "Home" + "{N} pages" 메타 렌더
  it("제목과 페이지 수 메타를 렌더한다", () => {
    render(<PageHeader totalCount={631} />);
    expect(screen.getByRole("heading", { name: "Home" })).toBeTruthy();
    expect(screen.getByText(/631 pages/)).toBeTruthy();
  });
  // 스펙: New Page 버튼이 문서 생성 액션 폼으로 제출(server action 주입)
  it("New Page 버튼을 렌더한다", () => {
    render(<PageHeader totalCount={0} />);
    expect(screen.getByRole("button", { name: /New Page/ })).toBeTruthy();
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL (모듈 없음)

- [ ] **Step 3: 구현** — 청사진 값 그대로. `createDraftDocument` 서버 액션을 form action으로(Task 8에서 app/actions.ts 확정 전까지 import 경로는 `@/app/me/actions`; Task 8에서 `@/app/actions`로 정리).

```tsx
import { Plus } from "lucide-react";
import { createDraftDocument } from "@/app/me/actions";

type Props = { totalCount: number };

export function PageHeader({ totalCount }: Props) {
  return (
    <div className="mb-[22px] flex items-end justify-between">
      <div>
        <h1 className="m-0 font-serif text-[30px] font-semibold tracking-[-0.02em]">
          Home
        </h1>
        <div className="mt-1.5 text-[12.5px] text-ink-muted">
          Your knowledge workspace · {totalCount} pages
        </div>
      </div>
      <form action={createDraftDocument}>
        <button
          type="submit"
          className="flex h-[38px] items-center gap-[7px] rounded-[9px] bg-primary px-4 text-[12.5px] font-medium text-primary-fg"
        >
          <Plus size={15} strokeWidth={2.2} /> New Page
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인** → PASS (2 tests)
- [ ] **Step 5: 커밋** — `git add components/home/PageHeader.tsx components/home/__tests__/PageHeader.test.tsx` → `feat(wiki): S2-3 PageHeader`

---

## Task 4: HomeTabs (TDD)

**Files:** Create `components/home/HomeTabs.tsx`, Test `components/home/__tests__/HomeTabs.test.tsx`

청사진 참조: Frame 1 "tabs" — gap 26, `border-bottom:1px solid #ebedf1`; 활성("Recently edited") `font-weight:600;color:#1b2430;border-bottom:2px solid #182232`; 비활성 `color:#8b94a3`.

- [ ] **Step 1: 실패 테스트**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeTabs } from "@/components/home/HomeTabs";

describe("HomeTabs", () => {
  // 스펙: 4개 탭 렌더, Recently edited 활성(aria-current), 나머지 비활성
  it("탭 4개 중 Recently edited 만 활성", () => {
    render(<HomeTabs />);
    for (const t of ["Recently edited", "Starred", "Created by me", "All pages"]) {
      expect(screen.getByText(t)).toBeTruthy();
    }
    expect(screen.getByText("Recently edited").getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Starred").getAttribute("aria-current")).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** — S2에선 Recently edited만 활성(정적). 나머지는 자리(클릭 비활성).

```tsx
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
```

- [ ] **Step 4: 통과 확인** → PASS
- [ ] **Step 5: 커밋** — `feat(wiki): S2-4 HomeTabs`

---

## Task 5: JumpBackIn (TDD)

**Files:** Create `components/home/JumpBackIn.tsx`, Test `components/home/__tests__/JumpBackIn.test.tsx`

청사진 참조: Frame 1 "jump back in" — 라벨 `font-size:11;font-weight:600;letter-spacing:.08em;color:#9aa2b1`; grid `repeat(4,1fr) gap14`; 카드 `bg #fff;border 1px #ebedf1;radius10;padding 15px 16px`; 타일 `32×32;radius8;margin-bottom24`; 제목 `13/600;color #1b2430;line1.3`; 메타 `11;color #9aa2b1`. 입력은 `DashboardDoc[]`.

- [ ] **Step 1: 실패 테스트**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JumpBackIn } from "@/components/home/JumpBackIn";

const docs = [
  { id: "1", title: "Systems Architecture", project: "Projects", updatedAt: "2026-06-29T10:00:00Z" },
  { id: "2", title: "Cognitive Load", project: "Research", updatedAt: "2026-06-29T07:00:00Z" },
];
const NOW = new Date("2026-06-29T12:00:00Z");

describe("JumpBackIn", () => {
  // 스펙: 라벨 + 각 문서 카드(제목, "프로젝트 · Edited Nh ago") 렌더
  it("문서 카드를 렌더한다", () => {
    render(<JumpBackIn docs={docs} now={NOW} />);
    expect(screen.getByText("JUMP BACK IN")).toBeTruthy();
    expect(screen.getByText("Systems Architecture")).toBeTruthy();
    expect(screen.getByText(/Projects · Edited 2h ago/)).toBeTruthy();
  });
  // 스펙: 문서 0건이면 섹션을 렌더하지 않는다(null)
  it("문서가 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<JumpBackIn docs={[]} now={NOW} />);
    expect(container.querySelector("a")).toBeNull();
    expect(screen.queryByText("JUMP BACK IN")).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** — 카드 클릭 시 `/edit/{id}`. 타일은 통일(`bg-chip-2 text-ink-secondary` + `file-text`).

```tsx
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
            href={`/edit/${d.id}`}
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
```

- [ ] **Step 4: 통과 확인** → PASS (2 tests)
- [ ] **Step 5: 커밋** — `feat(wiki): S2-5 JumpBackIn 카드`

---

## Task 6: RecentlyEditedTable (TDD)

**Files:** Create `components/home/RecentlyEditedTable.tsx`, Test `components/home/__tests__/RecentlyEditedTable.test.tsx`

청사진 참조: Frame 1 "recently edited table". 카드 `border 1px #ebedf1;radius12;overflow hidden`. 헤더행 `bg #fafbfc;border-b;grid 1fr 116px 108px;gap12;padding 11px 18px`; 컬럼 `10/600;letter-spacing.07em;color #9aa2b1` "NAME/TAG/UPDATED"(UPDATED 우측). 데이터행 `padding 13px 18px;border-b #f0f1f4`(마지막 보더 없음): NAME = `file-text`(16,#8b94a3)+제목(13/500,#1b2430,ellipsis)+브레드크럼(11,#9aa2b1 "Knowledge Base / {project}"); TAG = 칩(`9.5/600;letter-spacing.05em;padding 3px 8px;radius5;bg #f1f2f5;color #6b7280`, project 대문자); UPDATED = 우측, 상대시각(11.5,#9aa2b1)+22px 아바타 원(#bg-border-strong).

- [ ] **Step 1: 실패 테스트**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentlyEditedTable } from "@/components/home/RecentlyEditedTable";

const docs = [
  { id: "1", title: "Systems Architecture", project: "Projects", updatedAt: "2026-06-29T10:00:00Z" },
];
const NOW = new Date("2026-06-29T12:00:00Z");

describe("RecentlyEditedTable", () => {
  // 스펙: 컬럼 헤더 + 행(제목, 브레드크럼, 태그칩=project대문자, 상대시각)
  it("문서 행을 렌더한다", () => {
    render(<RecentlyEditedTable docs={docs} now={NOW} />);
    expect(screen.getByText("NAME")).toBeTruthy();
    expect(screen.getByText("Systems Architecture")).toBeTruthy();
    expect(screen.getByText("Knowledge Base / Projects")).toBeTruthy();
    expect(screen.getByText("PROJECTS")).toBeTruthy(); // 태그칩 = project 대문자
    expect(screen.getByText("2h ago")).toBeTruthy();
  });
  // 스펙: 문서 0건이면 빈 상태 메시지
  it("빈 상태 메시지", () => {
    render(<RecentlyEditedTable docs={[]} now={NOW} />);
    expect(screen.getByText(/아직 문서가 없어요/)).toBeTruthy();
  });
  // 스펙: project 가 빈 문자열이면 태그칩을 렌더하지 않는다
  it("project 없으면 태그칩 생략", () => {
    render(
      <RecentlyEditedTable
        docs={[{ id: "2", title: "무제", project: "", updatedAt: "2026-06-29T10:00:00Z" }]}
        now={NOW}
      />,
    );
    expect(screen.queryByText("Knowledge Base /")).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** — 행 클릭 시 `/edit/{id}`.

```tsx
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
```

- [ ] **Step 4: 통과 확인** → PASS (3 tests)
- [ ] **Step 5: 커밋** — `feat(wiki): S2-6 RecentlyEditedTable`

---

## Task 7: 우측 레일 3패널 (TDD)

**Files:** Create `components/home/rail/Starred.tsx`, `RecentActivity.tsx`, `QuickAccess.tsx`, Test `components/home/__tests__/rail.test.tsx`

청사진 참조: Frame 1 "right rail" 3 패널(각 `bg #fff;border 1px #ebedf1;radius12`). 점 불릿 색 `#3a4a78`(최신)/`#c3c8d1`(이전)은 arbitrary.

- [ ] **Step 1: 실패 테스트** — `components/home/__tests__/rail.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Starred } from "@/components/home/rail/Starred";
import { RecentActivity } from "@/components/home/rail/RecentActivity";
import { QuickAccess } from "@/components/home/rail/QuickAccess";

const NOW = new Date("2026-06-29T12:00:00Z");

describe("rail/Starred", () => {
  // 스펙: 즐겨찾기 미구현 → 빈 상태 메시지
  it("빈 상태", () => {
    render(<Starred />);
    expect(screen.getByText("Starred")).toBeTruthy();
    expect(screen.getByText(/즐겨찾기/)).toBeTruthy();
  });
});

describe("rail/RecentActivity", () => {
  // 스펙: 최근 문서 → "Updated \"제목\" · 시각" 활동으로 표시
  it("최근 문서를 활동으로 표시", () => {
    render(
      <RecentActivity
        docs={[{ id: "1", title: "Bio Interface", project: "P", updatedAt: "2026-06-29T10:00:00Z" }]}
        now={NOW}
      />,
    );
    expect(screen.getByText("Recent activity")).toBeTruthy();
    expect(screen.getByText(/Updated "Bio Interface"/)).toBeTruthy();
    expect(screen.getByText(/2h ago/)).toBeTruthy();
  });
});

describe("rail/QuickAccess", () => {
  // 스펙: 4개 백로그 항목, 전부 aria-disabled
  it("백로그 항목은 비활성", () => {
    render(<QuickAccess />);
    for (const l of ["Global Graph", "Reading Queue", "Canvas Mode", "Collections"]) {
      expect(screen.getByText(l).getAttribute("aria-disabled")).toBe("true");
    }
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현**

`components/home/rail/Starred.tsx`:

```tsx
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
```

`components/home/rail/RecentActivity.tsx`:

```tsx
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
```

`components/home/rail/QuickAccess.tsx`:

```tsx
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
```

- [ ] **Step 4: 통과 확인** → PASS (3 tests)
- [ ] **Step 5: 커밋** — `git add components/home/rail/ components/home/__tests__/rail.test.tsx` → `feat(wiki): S2-7 우측 레일 3패널`

---

## Task 8: 홈 조립 + 라우팅 전환 + 전체 회귀

**Files:** Create `app/actions.ts`; Modify `app/page.tsx`, `app/me/page.tsx`, `app/me/actions.ts`, `components/home/PageHeader.tsx`

- [ ] **Step 1: 문서 생성 액션 이동** — `app/actions.ts` 생성: 현 `app/me/actions.ts`의 `createDraftDocument`를 그대로 옮긴다. `app/me/actions.ts`는 재노출(`export { createDraftDocument } from "@/app/actions";`)로 두어 기존 import 깨지지 않게 한다. `PageHeader.tsx`의 import를 `@/app/actions`로 변경.

`app/actions.ts` (현 me/actions.ts 내용 그대로):

```ts
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createDraftDocument(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let createdId: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const slug = `draft-${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await supabase
      .from("documents")
      .insert({ slug, title: "", owner_id: user.id })
      .select("id")
      .single();
    if (!error && data) { createdId = data.id; break; }
    if (error?.code !== "23505") {
      console.error("[createDraftDocument] insert error:", error);
      throw new Error("새 문서 만들기에 실패했어요.");
    }
  }
  if (!createdId) throw new Error("슬러그 생성 실패. 다시 시도해주세요.");
  redirect(`/edit/${createdId}`);
}
```

`app/me/actions.ts` 교체:

```ts
export { createDraftDocument } from "@/app/actions";
```

- [ ] **Step 2: 홈 대시보드 조립** — `app/page.tsx` 교체 (서버 컴포넌트)

```tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/home/get-dashboard";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/home/PageHeader";
import { HomeTabs } from "@/components/home/HomeTabs";
import { JumpBackIn } from "@/components/home/JumpBackIn";
import { RecentlyEditedTable } from "@/components/home/RecentlyEditedTable";
import { Starred } from "@/components/home/rail/Starred";
import { RecentActivity } from "@/components/home/rail/RecentActivity";
import { QuickAccess } from "@/components/home/rail/QuickAccess";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { totalCount, recent } = await getDashboardData(user.id);
  const now = new Date();

  return (
    <AppShell email={user.email ?? ""}>
      <PageHeader totalCount={totalCount} />
      <HomeTabs />
      <JumpBackIn docs={recent} now={now} />
      <div className="grid grid-cols-[1fr_290px] items-start gap-7">
        <div>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="m-0 font-serif text-[18px] font-semibold">Recently edited</h2>
          </div>
          <RecentlyEditedTable docs={recent} now={now} />
        </div>
        <div className="flex flex-col gap-5">
          <Starred />
          <RecentActivity docs={recent} now={now} />
          <QuickAccess />
        </div>
      </div>
    </AppShell>
  );
}
```

> `now`를 서버에서 만들어 prop으로 내려 컴포넌트를 순수하게 유지(테스트 용이). 클라이언트 시각 동기화는 후속.

- [ ] **Step 3: `/me` → `/` redirect** — `app/me/page.tsx` 교체

```tsx
import { redirect } from "next/navigation";

export default function MePage() {
  redirect("/");
}
```

- [ ] **Step 4: 타입 검사** — Run: `pnpm tsc --noEmit` → PASS

- [ ] **Step 5: 전체 테스트 (회귀)** — Run: `pnpm test` → 신규 S2 테스트 + 기존(S1 셸 + documents + health) 모두 PASS. 깨지면 테스트가 아니라 신규 코드 수정.

- [ ] **Step 6: 빌드 스모크** — Run: `pnpm build` → `/`가 대시보드로, `/me`가 redirect로 컴파일.

- [ ] **Step 7: 커밋**

```bash
git add app/actions.ts app/page.tsx app/me/page.tsx app/me/actions.ts components/home/PageHeader.tsx
git commit -m "feat(wiki): S2-8 홈 대시보드 조립 + /me→/ 라우팅 전환"
```

---

## 완료 조건 (S2 전체)

- [ ] `pnpm tsc --noEmit` 통과
- [ ] `pnpm test` 통과 (신규 + 기존 회귀)
- [ ] `pnpm build` 성공
- [ ] `/` 가 청사진 Frame 1 레이아웃(헤더·탭·Jump back in·테이블·레일)으로 렌더, 최근 문서가 실데이터로 표시, 빈 상태/비활성 영역이 청사진 레이아웃 유지
- [ ] `/me` 접속 시 `/` 로 redirect

## 셀프 리뷰 노트

- **타입 일관성**: `DashboardDoc {id,title,project,updatedAt}`가 `get-dashboard`·모든 컴포넌트 prop·테스트에서 동일. `relativeTime(iso, now)` 인자 순서 일관.
- **경계**: 모든 home 컴포넌트는 `now`를 prop으로 받는 순수 표현(서버에서 `new Date()` 주입) → 테스트가 시간 고정 가능. `app/page.tsx`만 데이터 조회.
- **청사진 충실**: 각 컴포넌트 구현 시 dc.html Frame 1 블록의 색·크기·간격을 토큰 클래스로 변환. 토큰에 없는 색만 arbitrary value.
- **회귀**: `createDraftDocument`를 `app/actions.ts`로 옮기되 `app/me/actions.ts` 재노출로 기존 import 보존. `/me` redirect로 기존 링크 보존.
- **YAGNI**: 탭 토글·View all·즐겨찾기·실태그·활동로그는 비범위(자리/빈상태/파생). 사이드바 Knowledge Tree는 S3.
