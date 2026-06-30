# S5 — 읽기 뷰 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/p/[slug]` 읽기 뷰(청사진 Frame 2)를 구현하고, "보기 ↔ 편집" 흐름을 정상화한다 — 트리·목록·카드의 문서 클릭을 읽기 뷰로 보내고, 읽기 뷰의 Edit 버튼으로 편집기에 들어간다.

**Architecture:** 순수 변환(sanitize/toc/reading-time)은 `lib/render/`에 분리해 TDD. 읽기 뷰는 서버 컴포넌트가 `getDocumentBySlug`+`getTree`로 데이터를 모아 `blocksToHtml`→`sanitize`→TOC 추출 후 `Article`(본문)과 `TocNav`(스크롤 스파이, client)로 렌더. slug를 `DashboardDoc`/`DocRow`에 추가해 클릭 경로를 `/p/{slug}`로 바꾼다.

**Tech Stack:** Next.js 16, React 19, Supabase, Tailwind v4, lucide-react, `sanitize-html`, vitest + @testing-library/react.

---

## 배경 / 참고 스펙

- **S5 설계**: `docs/superpowers/specs/2026-06-30-s5-reading-view-design.html`
- **청사진 Frame 2**: `Digital Sanctuary.dc.html` FRAME 2: ARTICLE DETAIL 블록 (픽셀)
- **기존**: `blocksToHtml(blocks)`(lib/export/html.ts, `blocksToFullHTML` 호출 — 본문 조각 HTML 반환), `getDocument(id, ownerId)`(get.ts), `profiles.nickname`(저자), `documents.slug`(UNIQUE NOT NULL 존재). 클릭 라우팅: TreeNodeRow/RecentlyEditedTable/JumpBackIn 모두 `/edit/{id}`.

## 토큰/픽셀 참조

읽기 본문(청사진): 제목 serif 38/600/1.12/-.02em, h2 serif 22/600, 본문 serif 15/line1.65 `text-ink-2`(#384150), 데크 좌3px보더 italic serif 16 `text-ink-secondary`, 코드블록 `bg-primary` mono 12.5/1.7, Editor's Note `bg-chip-2`. TOC 라벨 10/600/.09em, 활성 좌2px `bg-primary` + `text-ink`/600.

---

## Task 1: sanitize-html 도입 + sanitize 래퍼 (TDD)

**Files:** Create `lib/render/sanitize.ts`, Test `lib/render/__tests__/sanitize.test.ts`; Modify `package.json`

- [ ] **Step 1: 설치** — `pnpm add sanitize-html && pnpm add -D @types/sanitize-html`

- [ ] **Step 2: 실패 테스트**

```ts
import { describe, it, expect } from "vitest";
import { sanitizeContentHtml } from "@/lib/render/sanitize";

describe("sanitizeContentHtml", () => {
  // 스펙: script 태그 제거
  it("script 를 제거한다", () => {
    expect(sanitizeContentHtml('<p>hi</p><script>alert(1)</script>')).not.toContain("script");
  });
  // 스펙: on* 핸들러 속성 제거
  it("onerror 등 이벤트 핸들러를 제거한다", () => {
    expect(sanitizeContentHtml('<img src="x" onerror="alert(1)">')).not.toContain("onerror");
  });
  // 스펙: 허용 태그(제목/문단/목록/코드/강조/링크/이미지) 보존
  it("허용 태그를 보존한다", () => {
    const html = '<h2>T</h2><p><strong>b</strong></p><ul><li>x</li></ul><pre><code>c</code></pre><a href="/x">l</a>';
    const out = sanitizeContentHtml(html);
    for (const t of ["<h2>", "<strong>", "<ul>", "<li>", "<pre>", "<code>", "<a"]) {
      expect(out).toContain(t);
    }
  });
});
```

- [ ] **Step 3: 실패 확인** → FAIL

- [ ] **Step 4: 구현** — `lib/render/sanitize.ts`

```ts
import sanitizeHtml from "sanitize-html";

/** 공개 경계용 HTML sanitize. BlockNote 출력 태그 허용, script/on* 제거. */
export function sanitizeContentHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "h1", "h2",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      "*": ["id"],
    },
    allowedSchemes: ["http", "https", "mailto", "data"],
  });
}
```

- [ ] **Step 5: 통과 확인** → PASS, `pnpm tsc --noEmit`
- [ ] **Step 6: 커밋** — `git add package.json pnpm-lock.yaml lib/render/sanitize.ts lib/render/__tests__/sanitize.test.ts` → `feat(wiki): S5-1 sanitize-html 래퍼`

---

## Task 2: TOC 헤딩 추출 (TDD)

**Files:** Create `lib/render/toc.ts`, Test `lib/render/__tests__/toc.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
import { describe, it, expect } from "vitest";
import { extractToc, slugifyHeading } from "@/lib/render/toc";

describe("slugifyHeading", () => {
  it("텍스트를 id 로 slugify", () => {
    expect(slugifyHeading("Hello World")).toBe("hello-world");
    expect(slugifyHeading("코어 원칙")).toBe("코어-원칙");
  });
});

describe("extractToc", () => {
  // 스펙: h2/h3 추출(level/text/id), 중복 id 는 -2 suffix
  it("h2/h3 를 추출하고 id 를 부여한다", () => {
    const { items } = extractToc("<h2>Intro</h2><p>x</p><h3>Sub</h3><h2>Intro</h2>");
    expect(items).toEqual([
      { id: "intro", text: "Intro", level: 2 },
      { id: "sub", text: "Sub", level: 3 },
      { id: "intro-2", text: "Intro", level: 2 },
    ]);
  });
  // 스펙: 헤딩에 id 주입된 html 반환
  it("html 에 헤딩 id 를 주입한다", () => {
    const { html } = extractToc("<h2>Intro</h2>");
    expect(html).toContain('id="intro"');
  });
  // 스펙: 헤딩 없으면 빈 목차
  it("헤딩 없으면 빈 목차", () => {
    expect(extractToc("<p>no heading</p>").items).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** — `lib/render/toc.ts` (정규식 기반, 서버/순수)

```ts
export type TocItem = { id: string; text: string; level: 2 | 3 };

/** 헤딩 텍스트 → URL-safe id (영문 소문자화, 공백→-, 한글 보존). */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

/** html 에서 h2/h3 추출 + id 주입. 중복 id 는 -N suffix. */
export function extractToc(html: string): { items: TocItem[]; html: string } {
  const items: TocItem[] = [];
  const seen = new Map<string, number>();
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, lvl: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    let id = slugifyHeading(text);
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    if (n > 1) id = `${id}-${n}`;
    items.push({ id, text, level: Number(lvl) as 2 | 3 });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });
  return { items, html: out };
}
```

- [ ] **Step 4: 통과 확인** → PASS
- [ ] **Step 5: 커밋** — `feat(wiki): S5-2 TOC 헤딩 추출 순수 함수`

---

## Task 3: reading-time (TDD)

**Files:** Create `lib/render/reading-time.ts`, Test `lib/render/__tests__/reading-time.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
import { describe, it, expect } from "vitest";
import { readingTime } from "@/lib/render/reading-time";

describe("readingTime", () => {
  it("빈 텍스트는 1분(최소)", () => {
    expect(readingTime("")).toBe(1);
  });
  // 스펙: 분당 약 500자 기준, 올림, 최소 1
  it("긴 텍스트는 분 단위 올림", () => {
    expect(readingTime("가".repeat(500))).toBe(1);
    expect(readingTime("가".repeat(501))).toBe(2);
    expect(readingTime("가".repeat(1500))).toBe(3);
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현**

```ts
const CHARS_PER_MIN = 500; // 한글 읽기 속도 추정

/** 텍스트 → 읽기 시간(분, 올림, 최소 1). */
export function readingTime(text: string): number {
  const chars = text.trim().length;
  return Math.max(1, Math.ceil(chars / CHARS_PER_MIN));
}
```

- [ ] **Step 4: 통과 확인** → PASS
- [ ] **Step 5: 커밋** — `feat(wiki): S5-3 reading-time 순수 함수`

---

## Task 4: getDocumentBySlug 조회 헬퍼

**Files:** Create `lib/documents/get-by-slug.ts`, Test `lib/documents/__tests__/get-by-slug.test.ts`

> Supabase 의존 — 매핑 함수만 단위 테스트.

- [ ] **Step 1: 실패 테스트** (매핑)

```ts
import { describe, it, expect } from "vitest";
import { mapBySlugRow } from "@/lib/documents/get-by-slug";

describe("mapBySlugRow", () => {
  it("row 매핑(null 방어)", () => {
    expect(
      mapBySlugRow({ id: "d", owner_id: "o", title: null, slug: "s", project: null, content: [{}], updated_at: "t" }),
    ).toMatchObject({ id: "d", title: "", slug: "s", project: "" });
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** — `lib/documents/get-by-slug.ts`

```ts
import { createClient } from "@/lib/supabase/server";
import { BlocksSchema, type Blocks } from "@/lib/documents/types";

export type ReadDoc = {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  project: string;
  content: Blocks;
  updatedAt: string;
};

export function mapBySlugRow(r: {
  id: string; owner_id: string; title: string | null; slug: string;
  project: string | null; content: unknown; updated_at: string;
}): ReadDoc {
  const content = BlocksSchema.safeParse(r.content);
  return {
    id: r.id, ownerId: r.owner_id, title: r.title ?? "", slug: r.slug,
    project: r.project ?? "", content: content.success ? content.data : [], updatedAt: r.updated_at,
  };
}

/** slug + owner 로 읽기용 문서 1건. 없으면 null. */
export async function getDocumentBySlug(slug: string, ownerId: string): Promise<ReadDoc | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, owner_id, title, slug, project, content, updated_at")
    .eq("slug", slug)
    .eq("owner_id", ownerId)
    .single();
  if (error || !data) return null;
  return mapBySlugRow(data);
}
```

- [ ] **Step 4: 통과 확인** → PASS, `pnpm tsc --noEmit`
- [ ] **Step 5: 커밋** — `feat(wiki): S5-4 getDocumentBySlug 조회 헬퍼`

---

## Task 5: slug 전파 (DashboardDoc / DocRow)

**Files:** Modify `lib/home/types.ts`, `lib/home/get-dashboard.ts`, `lib/home/__tests__/get-dashboard.test.ts`, `lib/tree/types.ts`, `lib/tree/get-tree.ts`, `lib/tree/__tests__/get-tree.test.ts`, `lib/tree/build-tree.ts`(필요시), `lib/tree/__tests__/*`

- [ ] **Step 1: 타입에 slug 추가** — `DashboardDoc`에 `slug: string`, `DocRow`(tree)에 `slug: string`.

- [ ] **Step 2: select + 매핑 갱신** — `get-dashboard.ts`의 select에 `slug`, `mapDashboardRow`에 `slug: row.slug`. `get-tree.ts`의 documents select에 `slug`, `mapDocRow`에 `slug: r.slug`.

- [ ] **Step 3: 매핑 테스트 갱신** — 기존 `get-dashboard.test.ts`·`get-tree.test.ts`의 매핑 기대값에 `slug` 추가(요구사항 확장 — 의도된 변경). build-tree 테스트의 DocRow 입력에 slug 추가(타입 충족).

- [ ] **Step 4: 통과 확인** — `pnpm tsc --noEmit` + `pnpm vitest run lib/home lib/tree` → PASS

- [ ] **Step 5: 커밋** — `feat(wiki): S5-5 slug 전파(DashboardDoc/DocRow)`

---

## Task 6: Article 컴포넌트 + 본문 prose 스타일 (TDD)

**Files:** Create `components/reading/Article.tsx`, `components/reading/prose.css`, Test `components/reading/__tests__/Article.test.tsx`; Modify `app/globals.css`(prose import 또는 클래스)

청사진 참조: Frame 2 아티클 컬럼. 브레드크럼·h1·데크·본문·저자·푸터.

- [ ] **Step 1: 실패 테스트**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Article } from "@/components/reading/Article";

describe("Article", () => {
  const base = {
    title: "The Architecture of Silence",
    breadcrumb: ["Knowledge Base", "Research"],
    html: '<h2 id="intro">Introduction</h2><p>body text</p>',
    author: "areum",
    updatedLabel: "2 days ago",
    readingMin: 8,
    editHref: "/edit/d1",
  };
  it("제목·브레드크럼·본문을 렌더한다", () => {
    render(<Article {...base} />);
    expect(screen.getByRole("heading", { level: 1, name: /Architecture of Silence/ })).toBeTruthy();
    expect(screen.getByText("Introduction")).toBeTruthy();
    expect(screen.getByText("body text")).toBeTruthy();
  });
  it("Edit 버튼(editHref)을 렌더한다", () => {
    render(<Article {...base} />);
    const link = screen.getByRole("link", { name: /Edit/ });
    expect(link.getAttribute("href")).toBe("/edit/d1");
  });
  it("저자·읽기시간 메타를 렌더한다", () => {
    render(<Article {...base} />);
    expect(screen.getByText("areum")).toBeTruthy();
    expect(screen.getByText(/8 min/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** — `Article.tsx`. 본문은 `dangerouslySetInnerHTML`(이미 sanitized) + `prose-reading` 클래스. Edit 버튼은 `editHref`.

```tsx
import Link from "next/link";
import { PenLine } from "lucide-react";

type Props = {
  title: string;
  breadcrumb: string[];
  html: string; // sanitized + toc id 주입됨
  author: string;
  updatedLabel: string;
  readingMin: number;
  editHref?: string;
};

export function Article({ title, breadcrumb, html, author, updatedLabel, readingMin, editHref }: Props) {
  return (
    <article className="min-w-0 flex-1">
      <div className="mb-4 text-[11.5px] text-ink-faint">
        {breadcrumb.join(" / ")}{breadcrumb.length ? " / " : ""}
        <span className="font-semibold text-ink-secondary">{title}</span>
      </div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <h1 className="m-0 font-serif text-[38px] font-semibold leading-[1.12] tracking-[-0.02em]">{title}</h1>
        {editHref && (
          <Link
            href={editHref}
            className="mt-2 flex h-[34px] flex-shrink-0 items-center gap-1.5 rounded-md border border-border-input bg-surface px-4 text-[12.5px] font-medium text-ink"
          >
            <PenLine size={14} strokeWidth={1.8} /> Edit
          </Link>
        )}
      </div>
      <div className="prose-reading" dangerouslySetInnerHTML={{ __html: html }} />
      <div className="mt-7 flex items-center justify-between border-t border-border-strong pt-5">
        <div className="flex items-center gap-2.5">
          <div className="h-[34px] w-[34px] rounded-full bg-border-strong" aria-hidden />
          <div className="text-[12.5px] font-semibold">{author}</div>
        </div>
        <div className="text-right text-[11px] leading-relaxed text-ink-faint">
          Last edited: {updatedLabel}<br />Reading time: {readingMin} min
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: prose 스타일** — `app/globals.css`에 `.prose-reading` 자식 셀렉터(청사진 읽기 타이포):

```css
@layer components {
  .prose-reading { font-family: var(--font-serif); color: var(--color-ink-2); }
  .prose-reading h2 { font-family: var(--font-serif); font-size: 22px; font-weight: 600; color: var(--color-ink); margin: 28px 0 12px; }
  .prose-reading h3 { font-size: 18px; font-weight: 600; color: var(--color-ink); margin: 22px 0 10px; }
  .prose-reading p { font-size: 15px; line-height: 1.65; margin: 0 0 18px; }
  .prose-reading ul, .prose-reading ol { font-size: 15px; line-height: 1.55; padding-left: 20px; margin: 0 0 22px; }
  .prose-reading li { margin-bottom: 8px; }
  .prose-reading blockquote { border-left: 3px solid var(--color-border-input); padding-left: 18px; font-style: italic; color: var(--color-ink-secondary); margin: 0 0 22px; }
  .prose-reading pre { background: var(--color-primary); color: #cdd6e4; border-radius: 10px; padding: 20px 22px; font-family: var(--font-mono); font-size: 12.5px; line-height: 1.7; overflow: auto; margin: 0 0 22px; }
  .prose-reading code { font-family: var(--font-mono); font-size: 0.9em; }
  .prose-reading pre code { background: none; color: inherit; }
  .prose-reading img { max-width: 100%; border-radius: 10px; margin: 0 0 22px; }
  .prose-reading a { color: var(--color-accent-soft-fg); text-decoration: underline; }
}
```

- [ ] **Step 5: 통과 확인** → PASS (3 tests)
- [ ] **Step 6: 커밋** — `git add components/reading/Article.tsx components/reading/__tests__/Article.test.tsx app/globals.css` → `feat(wiki): S5-6 Article 컴포넌트 + 읽기 prose 스타일`

---

## Task 7: TocNav 컴포넌트 (TDD)

**Files:** Create `components/reading/TocNav.tsx`, Test `components/reading/__tests__/TocNav.test.tsx`

청사진 참조: Frame 2 TOC — "ON THIS PAGE" 라벨, 좌1px보더 목록, 활성 좌2px primary 바.

- [ ] **Step 1: 실패 테스트**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// IntersectionObserver mock (happy-dom)
vi.stubGlobal("IntersectionObserver", class {
  observe() {} disconnect() {} unobserve() {}
});

import { TocNav } from "@/components/reading/TocNav";

const items = [
  { id: "intro", text: "Introduction", level: 2 as const },
  { id: "core", text: "Core", level: 2 as const },
];

describe("TocNav", () => {
  it("ON THIS PAGE 라벨과 항목을 렌더한다", () => {
    render(<TocNav items={items} relatedTitles={["Gestalt"]} />);
    expect(screen.getByText("ON THIS PAGE")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Introduction" }).getAttribute("href")).toBe("#intro");
  });
  it("RELATED PAGES 를 렌더한다", () => {
    render(<TocNav items={items} relatedTitles={["Gestalt"]} />);
    expect(screen.getByText("RELATED PAGES")).toBeTruthy();
    expect(screen.getByText("Gestalt")).toBeTruthy();
  });
  it("헤딩 없으면 TOC 라벨을 숨긴다", () => {
    render(<TocNav items={[]} relatedTitles={[]} />);
    expect(screen.queryByText("ON THIS PAGE")).toBeNull();
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** — `TocNav.tsx` ("use client", IntersectionObserver 스크롤 스파이)

```tsx
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
```

- [ ] **Step 4: 통과 확인** → PASS (3 tests)
- [ ] **Step 5: 커밋** — `feat(wiki): S5-7 TocNav(스크롤 스파이)`

---

## Task 8: /p/[slug] 라우트 조립 + Topbar Edit 버튼

**Files:** Create `app/p/[slug]/page.tsx`; Modify `components/shell/Topbar.tsx`(선택 — Edit는 Article에 이미 있으므로 Topbar는 그대로 둬도 됨)

- [ ] **Step 1: 라우트 조립** — `app/p/[slug]/page.tsx` (서버)

```tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDocumentBySlug } from "@/lib/documents/get-by-slug";
import { getTree } from "@/lib/tree/get-tree";
import { blocksToHtml } from "@/lib/export/html";
import { sanitizeContentHtml } from "@/lib/render/sanitize";
import { extractToc } from "@/lib/render/toc";
import { readingTime } from "@/lib/render/reading-time";
import { relativeTime } from "@/lib/format/relative-time";
import { AppShell } from "@/components/shell/AppShell";
import { Article } from "@/components/reading/Article";
import { TocNav } from "@/components/reading/TocNav";

type Props = { params: Promise<{ slug: string }> };

export default async function ReadPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [doc, tree] = await Promise.all([
    getDocumentBySlug(slug, user.id),
    getTree(user.id),
  ]);
  if (!doc) notFound();

  const rawHtml = await blocksToHtml(doc.content);
  const safe = sanitizeContentHtml(rawHtml);
  const { items, html } = extractToc(safe);
  const text = safe.replace(/<[^>]+>/g, " ");
  const isOwner = doc.ownerId === user.id;

  return (
    <AppShell email={user.email ?? ""} tree={tree} searchPlaceholder="Search...">
      <div className="flex gap-12">
        <Article
          title={doc.title || "제목 없는 문서"}
          breadcrumb={["Knowledge Base", doc.project].filter(Boolean)}
          html={html}
          author={user.email?.split("@")[0] ?? ""}
          updatedLabel={relativeTime(doc.updatedAt, new Date())}
          readingMin={readingTime(text)}
          editHref={isOwner ? `/edit/${doc.id}` : undefined}
        />
        <TocNav items={items} relatedTitles={[]} />
      </div>
    </AppShell>
  );
}
```

> 저자명은 일단 `user.email` 앞부분(owner 본인 읽기). profiles.nickname 조인은 후속. Related는 빈 배열(후속 — 같은 폴더 문서).

- [ ] **Step 2: 검증** — `pnpm tsc --noEmit`. (Article/TocNav 테스트는 Task 6/7에서 통과.)

- [ ] **Step 3: 커밋** — `git add "app/p/[slug]/page.tsx"` → `feat(wiki): S5-8 /p/[slug] 읽기 뷰 라우트 조립`

---

## Task 9: 클릭 라우팅 변경 (/edit → /p/{slug}) + 전체 회귀

**Files:** Modify `components/shell/tree/TreeNodeRow.tsx`, `components/home/RecentlyEditedTable.tsx`, `components/home/JumpBackIn.tsx`, 관련 테스트

- [ ] **Step 1: 트리 문서 링크 변경** — `TreeNodeRow.tsx` 문서 행 `href={`/edit/${node.id}`}` → `href={`/p/${node.slug}`}`. (DocRow에 slug 있음 — Task 5.) 드래그 처리는 그대로.

- [ ] **Step 2: Recently edited / Jump back in 링크 변경** — 각 문서 링크 `/edit/${d.id}` → `/p/${d.slug}`. (DashboardDoc에 slug 있음.)

- [ ] **Step 3: 테스트 갱신** — 각 컴포넌트 테스트에서 링크 href 기대값을 `/p/{slug}`로(요구사항 변경 — 의도된). 테스트 입력 데이터에 slug 추가. KnowledgeTree.test.tsx 문서 노드에 slug.

- [ ] **Step 4: 타입** — `pnpm tsc --noEmit` PASS

- [ ] **Step 5: 전체 테스트** — `pnpm test` → 신규(sanitize/toc/reading-time/Article/TocNav) + 갱신(슬러그·링크) + 기존 전부 PASS. 회귀 시 신규 코드 수정.

- [ ] **Step 6: 빌드** — `pnpm build` → `/p/[slug]` 컴파일 + 기존 라우트.

- [ ] **Step 7: 커밋** — `git add components/shell/tree/TreeNodeRow.tsx components/home/RecentlyEditedTable.tsx components/home/JumpBackIn.tsx <갱신 테스트들>` → `feat(wiki): S5-9 문서 클릭을 읽기뷰로(/p/slug) + 회귀`

---

## 완료 조건 (S5 전체)

- [ ] `pnpm tsc --noEmit` / `pnpm test` / `pnpm build` 통과
- [ ] `/p/[slug]` 읽기 뷰가 청사진 Frame 2 레이아웃(브레드크럼·제목·본문·TOC·저자·푸터)로 렌더
- [ ] 트리/목록/카드 문서 클릭 → 읽기 뷰, Edit 버튼 → `/edit`, 신규 → `/edit`
- [ ] sanitize(script/on* 제거), TOC 스크롤 스파이 동작

## 셀프 리뷰 노트

- **흐름**: 신규(createDraftDocument)만 `/edit` 직행, 나머지 문서 진입은 `/p/{slug}` → Edit 버튼으로 편집. 사용자 멘탈 모델 일치.
- **타입 일관성**: `TocItem{id,text,level}`·`ReadDoc`·slug 추가가 전 모듈 정합. slug 전파(Task 5)가 Task 9 링크의 선행.
- **보안**: 읽기 뷰 본문은 sanitize 후 렌더. S4 공개 전환 시 그대로 익명 노출 안전.
- **회귀(의도된 변경)**: slug 추가·링크 변경으로 매핑/링크 테스트 갱신 — 요구사항 변경이므로 동기화.
- **YAGNI**: Related pages(빈 배열), profiles 조인 저자명, 푸터 indexed count는 후속/placeholder. figure/Editor's Note는 BlockNote 출력에 따라 prose 스타일로 커버.
