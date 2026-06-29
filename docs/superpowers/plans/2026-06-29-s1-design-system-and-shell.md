# S1 — 디자인 시스템 + 앱 셸 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tailwind v4 + 디자인 토큰 + 폰트 3종 + lucide-react를 도입하고, 청사진의 공통 앱 셸(Sidebar + Topbar + 콘텐츠)을 구축해 기존 화면(`/me`, `/edit/[id]`)을 셸에 통합한다.

**Architecture:** Tailwind v4를 PostCSS 플러그인으로 도입하고 `app/globals.css`의 `@theme`에 `tokens.css` 값을 매핑(CSS-first). 셸은 `components/shell/` 아래 작은 단위로 쪼갠다 — 네비 활성 판정은 순수 함수로 분리해 단위 테스트하고, `Sidebar`/`Topbar`는 `pathname`·`user`를 prop으로 받는 표현 컴포넌트로 만들어 테스트를 쉽게 한다. `AppShell`(client)이 `usePathname()`을 읽어 하위에 전달한다. 페이지(서버 컴포넌트)는 `getUser()` 결과를 `AppShell`에 넘긴다.

**Tech Stack:** Next.js 16.2.6 (webpack), React 19, Tailwind v4 (`@tailwindcss/postcss`), `lucide-react`, vitest 4 + @testing-library/react + happy-dom.

---

## 배경 / 참고 스펙

- 마스터 스펙: `docs/superpowers/specs/2026-06-29-ui-design-system-and-roadmap-design.html` (§5 앱 셸, §6 디자인 시스템)
- 디자인 토큰 원본: 사용자 제공 `tokens.css` (색·폰트·radius·간격), README의 `tailwind.config` 매핑
- 현재 상태: Tailwind/PostCSS/globals.css 없음. 인라인 `style`만. 폰트 Pretendard 하나. `lucide-react` 없음.

## 범위 (S1) / 비범위

**범위:** 빌드 토대(Tailwind+토큰+폰트+아이콘), `AppShell`/`Sidebar`/`Topbar`/`UserMenu`, 네비 활성 로직, `/me`·`/edit/[id]` 셸 통합.

**비범위(후속 슬라이스):** 홈 대시보드 콘텐츠(S2), 폴더 트리 데이터(S3 — S1에선 정적 placeholder 트리), 에디터 헤더/툴바(S4), 읽기 뷰(S5), 검색·태그(S6). Topbar의 Publish/Graphs/Templates는 **자리만**(비활성). `/login`은 인증 전 화면이라 셸로 감싸지 않는다.

## File Structure

| 파일 | 책임 |
|------|------|
| `postcss.config.mjs` (신규) | Tailwind v4 PostCSS 플러그인 등록 |
| `app/globals.css` (신규) | `@import "tailwindcss"` + `@theme` 토큰 + base 리셋 |
| `app/layout.tsx` (수정) | globals import, 폰트 `<link>`, body 기본 클래스 |
| `lib/shell/nav.ts` (신규) | 네비 항목 정의 + `isActiveNav()` 순수 함수 |
| `lib/shell/__tests__/nav.test.ts` (신규) | `isActiveNav` 단위 테스트 |
| `components/shell/Sidebar.tsx` (신규) | 사이드바 표현 컴포넌트(브랜드/주버튼/네비/트리 placeholder/하단) |
| `components/shell/Topbar.tsx` (신규) | 토픽바(Quick find/네비/아이콘/Publish placeholder) |
| `components/shell/UserMenu.tsx` (신규) | 사용자 블록 + 로그아웃 form |
| `components/shell/AppShell.tsx` (신규, client) | `usePathname()` + 레이아웃 조립 |
| `components/shell/__tests__/*.test.tsx` (신규) | Sidebar/Topbar/UserMenu/AppShell 렌더 테스트 |
| `app/me/page.tsx` (수정) | `AppShell`로 래핑 + Tailwind 클래스화 |
| `app/edit/[id]/page.tsx` (수정) | `AppShell`로 래핑(212px 변형) |

---

## Task 1: Tailwind v4 + 토큰 + 폰트 + 아이콘 도입

**Files:**
- Create: `postcss.config.mjs`
- Create: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `package.json` (의존성)

- [ ] **Step 1: 의존성 설치**

```bash
pnpm add lucide-react
pnpm add -D tailwindcss @tailwindcss/postcss
```

Expected: `package.json`에 `lucide-react`(dependencies), `tailwindcss`/`@tailwindcss/postcss`(devDependencies) 추가.

- [ ] **Step 2: PostCSS 설정 생성**

`postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 3: globals.css 작성 (`@theme`에 토큰 매핑)**

`app/globals.css`:

```css
@import "tailwindcss";

/* ── Digital Sanctuary 디자인 토큰 (tokens.css → Tailwind v4 @theme) ── */
@theme {
  /* color */
  --color-app: #f6f7f9;
  --color-surface: #ffffff;
  --color-surface-alt: #fafbfc;
  --color-ink: #1b2430;
  --color-ink-2: #384150;
  --color-ink-secondary: #5b6573;
  --color-ink-muted: #8b94a3;
  --color-ink-faint: #9aa2b1;
  --color-primary: #182232;
  --color-primary-fg: #ffffff;
  --color-border: #ebedf1;
  --color-border-2: #f0f1f4;
  --color-border-strong: #e6e8ec;
  --color-border-input: #d8dbe1;
  --color-chip: #f1f2f5;
  --color-chip-2: #eef0f3;
  --color-chip-ink: #6b7280;
  --color-accent-soft: #e9ebf6;
  --color-accent-soft-fg: #3a4a78;
  --color-star: #c9a23a;

  /* font */
  --font-serif: "Newsreader", Georgia, "Times New Roman", serif;
  --font-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;

  /* radius */
  --radius-sm: 6px;
  --radius-md: 9px;
  --radius-lg: 12px;
  --radius-xl: 14px;

  /* shadow */
  --shadow-card: 0 4px 16px rgba(20, 30, 48, 0.05);
}

/* base */
html,
body {
  margin: 0;
  background: var(--color-app);
  color: var(--color-ink);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}
```

- [ ] **Step 4: layout.tsx 수정 (globals import + 폰트 link + Pretendard 제거)**

`app/layout.tsx` 전체 교체:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "wiki",
  description: "개인 지식베이스 / 위키",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 5: 검증 — 타입 + 빌드 스모크**

Run: `pnpm tsc --noEmit`
Expected: PASS (에러 없음)

Run: `pnpm build`
Expected: 빌드 성공. globals.css가 처리되고 Tailwind 유틸이 생성된다(에러/경고 없이 컴파일 완료).

- [ ] **Step 6: 커밋**

```bash
git add package.json pnpm-lock.yaml postcss.config.mjs app/globals.css app/layout.tsx
git commit -m "feat(wiki): S1-1 Tailwind v4 + 디자인 토큰 + 폰트/아이콘 도입"
```

> 참고: 이 Task는 설정 중심이라 단위 테스트보다 빌드 스모크로 검증한다. 토큰 유틸의 실제 적용은 Task 3~6의 컴포넌트 테스트에서 클래스 존재로 간접 검증된다.

---

## Task 2: 네비 정의 + 활성 판정 순수 함수 (TDD)

**Files:**
- Create: `lib/shell/nav.ts`
- Test: `lib/shell/__tests__/nav.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

`lib/shell/__tests__/nav.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { NAV_ITEMS, isActiveNav } from "@/lib/shell/nav";

describe("nav", () => {
  // 스펙: 네비 항목은 청사진 순서(Home/Recent/Knowledge Base/Favorites/Folders/Archive)
  it("정의된 네비 항목 순서와 href를 가진다", () => {
    expect(NAV_ITEMS.map((n) => n.href)).toEqual([
      "/",
      "/recent",
      "/knowledge",
      "/favorites",
      "/folders",
      "/archive",
    ]);
  });

  // 스펙: 정확히 일치하면 활성
  it("현재 경로와 정확히 일치하면 활성", () => {
    expect(isActiveNav("/favorites", "/favorites")).toBe(true);
  });

  // 스펙: 홈("/")은 정확히 "/"일 때만 활성 (다른 경로의 prefix 가 아님)
  it('홈("/")은 정확히 "/"일 때만 활성', () => {
    expect(isActiveNav("/", "/")).toBe(true);
    expect(isActiveNav("/", "/favorites")).toBe(false);
  });

  // 스펙: 홈이 아닌 항목은 하위 경로도 활성 (예: /folders/123)
  it("비-홈 항목은 하위 경로에서도 활성", () => {
    expect(isActiveNav("/folders", "/folders/abc")).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run lib/shell/__tests__/nav.test.ts`
Expected: FAIL ("Cannot find module '@/lib/shell/nav'")

- [ ] **Step 3: 최소 구현**

`lib/shell/nav.ts`:

```ts
import {
  Home,
  History,
  Database,
  Star,
  Folder,
  Archive,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** 사이드바 주 네비 (청사진 Frame 1/2 순서). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recent", label: "Recent", icon: History },
  { href: "/knowledge", label: "Knowledge Base", icon: Database },
  { href: "/favorites", label: "Favorites", icon: Star },
  { href: "/folders", label: "Folders", icon: Folder },
  { href: "/archive", label: "Archive", icon: Archive },
];

/** 현재 pathname 기준 항목 활성 여부. 홈("/")은 정확히 일치할 때만. */
export function isActiveNav(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run lib/shell/__tests__/nav.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add lib/shell/nav.ts lib/shell/__tests__/nav.test.ts
git commit -m "feat(wiki): S1-2 네비 정의 + 활성 판정 순수 함수"
```

---

## Task 3: Sidebar 표현 컴포넌트 (TDD)

**Files:**
- Create: `components/shell/Sidebar.tsx`
- Test: `components/shell/__tests__/Sidebar.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`components/shell/__tests__/Sidebar.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/shell/Sidebar";

describe("Sidebar", () => {
  // 스펙: 브랜드 + 6개 네비 항목 렌더
  it("브랜드와 모든 네비 항목을 렌더한다", () => {
    render(<Sidebar pathname="/" userSlot={<div>user</div>} />);
    expect(screen.getByText("Digital Sanctuary")).toBeTruthy();
    for (const label of [
      "Home",
      "Recent",
      "Knowledge Base",
      "Favorites",
      "Folders",
      "Archive",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  // 스펙: 활성 항목은 aria-current="page"
  it('활성 항목에 aria-current="page" 를 준다', () => {
    render(<Sidebar pathname="/favorites" userSlot={null} />);
    const active = screen.getByRole("link", { name: /Favorites/ });
    expect(active.getAttribute("aria-current")).toBe("page");
    const inactive = screen.getByRole("link", { name: /Home/ });
    expect(inactive.getAttribute("aria-current")).toBeNull();
  });

  // 스펙: userSlot 을 하단에 렌더 (UserMenu 주입 지점)
  it("userSlot 을 렌더한다", () => {
    render(<Sidebar pathname="/" userSlot={<div>USER_SLOT</div>} />);
    expect(screen.getByText("USER_SLOT")).toBeTruthy();
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run components/shell/__tests__/Sidebar.test.tsx`
Expected: FAIL ("Cannot find module '@/components/shell/Sidebar'")

> 참고: testing-library matcher(`toBeTruthy` 등)는 기본 expect로 충분하다. `@testing-library/jest-dom`은 도입하지 않는다(현재 미설치).

- [ ] **Step 3: 최소 구현**

`components/shell/Sidebar.tsx`:

```tsx
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
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run components/shell/__tests__/Sidebar.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add components/shell/Sidebar.tsx components/shell/__tests__/Sidebar.test.tsx
git commit -m "feat(wiki): S1-3 Sidebar 표현 컴포넌트"
```

---

## Task 4: UserMenu + 로그아웃 (TDD)

**Files:**
- Create: `components/shell/UserMenu.tsx`
- Test: `components/shell/__tests__/UserMenu.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`components/shell/__tests__/UserMenu.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserMenu } from "@/components/shell/UserMenu";

describe("UserMenu", () => {
  // 스펙: 사용자 식별 텍스트(email 앞부분) 표시
  it("이메일에서 표시 이름을 보여준다", () => {
    render(<UserMenu email="areum@example.com" />);
    expect(screen.getByText("areum")).toBeTruthy();
  });

  // 스펙: 로그아웃은 POST /auth/sign-out 폼으로 제출
  it("로그아웃 폼이 POST /auth/sign-out 으로 제출된다", () => {
    render(<UserMenu email="areum@example.com" />);
    const button = screen.getByRole("button", { name: /로그아웃|Sign out/i });
    const form = button.closest("form");
    expect(form?.getAttribute("action")).toBe("/auth/sign-out");
    expect(form?.getAttribute("method")).toBe("post");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run components/shell/__tests__/UserMenu.test.tsx`
Expected: FAIL ("Cannot find module '@/components/shell/UserMenu'")

- [ ] **Step 3: 최소 구현**

`components/shell/UserMenu.tsx`:

```tsx
import { LogOut } from "lucide-react";

type Props = {
  /** 로그인 사용자 이메일. 표시 이름은 @ 앞부분. */
  email: string;
};

export function UserMenu({ email }: Props) {
  const displayName = email.split("@")[0];
  return (
    <div className="flex items-center gap-2.5 border-t border-border-2 px-2 pt-3">
      <div
        className="h-8 w-8 flex-shrink-0 rounded-full bg-border-strong"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold">{displayName}</div>
        <div className="text-[11px] text-ink-faint">Personal</div>
      </div>
      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          aria-label="로그아웃"
          className="flex h-7 w-7 items-center justify-center rounded-sm text-ink-secondary hover:bg-chip"
        >
          <LogOut size={15} strokeWidth={1.7} />
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run components/shell/__tests__/UserMenu.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add components/shell/UserMenu.tsx components/shell/__tests__/UserMenu.test.tsx
git commit -m "feat(wiki): S1-4 UserMenu + 로그아웃"
```

---

## Task 5: Topbar 표현 컴포넌트 (TDD)

**Files:**
- Create: `components/shell/Topbar.tsx`
- Test: `components/shell/__tests__/Topbar.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`components/shell/__tests__/Topbar.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Topbar } from "@/components/shell/Topbar";

describe("Topbar", () => {
  // 스펙: Quick find placeholder + Explorer 활성 텍스트
  it("Quick find 와 Explorer/Graphs/Templates 를 렌더한다", () => {
    render(<Topbar searchPlaceholder="Quick find..." />);
    expect(screen.getByText("Quick find...")).toBeTruthy();
    expect(screen.getByText("Explorer")).toBeTruthy();
    expect(screen.getByText("Graphs")).toBeTruthy();
    expect(screen.getByText("Templates")).toBeTruthy();
  });

  // 스펙: 백로그 기능(Graphs/Templates)은 비활성 — aria-disabled
  it("Graphs/Templates 는 aria-disabled 로 비활성 표시한다", () => {
    render(<Topbar searchPlaceholder="Search..." />);
    expect(screen.getByText("Graphs").getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("Templates").getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("Explorer").getAttribute("aria-disabled")).toBeNull();
  });

  // 스펙: Publish 버튼은 S1 에선 자리만 — disabled
  it("Publish 버튼은 S1 에서 비활성(disabled)", () => {
    render(<Topbar searchPlaceholder="Search..." />);
    const publish = screen.getByRole("button", { name: /Publish/ });
    expect(publish.hasAttribute("disabled")).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run components/shell/__tests__/Topbar.test.tsx`
Expected: FAIL ("Cannot find module '@/components/shell/Topbar'")

- [ ] **Step 3: 최소 구현**

`components/shell/Topbar.tsx`:

```tsx
import { Search, Bell, Settings } from "lucide-react";

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
      <Bell size={17} strokeWidth={1.7} className="text-ink-secondary" />
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
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run components/shell/__tests__/Topbar.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add components/shell/Topbar.tsx components/shell/__tests__/Topbar.test.tsx
git commit -m "feat(wiki): S1-5 Topbar 표현 컴포넌트(백로그 비활성 표시)"
```

---

## Task 6: AppShell 조립 (TDD)

**Files:**
- Create: `components/shell/AppShell.tsx`
- Test: `components/shell/__tests__/AppShell.test.tsx`

- [ ] **Step 1: 실패 테스트 작성**

`components/shell/__tests__/AppShell.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// next/navigation usePathname 모킹 (happy-dom)
const mockPathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

import { AppShell } from "@/components/shell/AppShell";

describe("AppShell", () => {
  beforeEach(() => mockPathname.mockReturnValue("/"));

  // 스펙: children, 사이드바(브랜드), 토픽바(Explorer), 사용자 이름을 함께 렌더
  it("children 과 셸 골격을 렌더한다", () => {
    render(
      <AppShell email="areum@example.com" searchPlaceholder="Quick find...">
        <div>PAGE_CONTENT</div>
      </AppShell>,
    );
    expect(screen.getByText("PAGE_CONTENT")).toBeTruthy();
    expect(screen.getByText("Digital Sanctuary")).toBeTruthy();
    expect(screen.getByText("Explorer")).toBeTruthy();
    expect(screen.getByText("areum")).toBeTruthy();
  });

  // 스펙: 현재 경로의 네비가 활성
  it("usePathname 결과로 네비 활성 상태를 정한다", () => {
    mockPathname.mockReturnValue("/favorites");
    render(
      <AppShell email="a@b.com" searchPlaceholder="Search...">
        <div>x</div>
      </AppShell>,
    );
    expect(
      screen.getByRole("link", { name: /Favorites/ }).getAttribute("aria-current"),
    ).toBe("page");
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm vitest run components/shell/__tests__/AppShell.test.tsx`
Expected: FAIL ("Cannot find module '@/components/shell/AppShell'")

- [ ] **Step 3: 최소 구현**

`components/shell/AppShell.tsx`:

```tsx
"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { UserMenu } from "./UserMenu";

type Props = {
  email: string;
  searchPlaceholder?: string;
  /** 사이드바 너비 (홈 228, 읽기·편집 212). */
  sidebarWidth?: number;
  children: React.ReactNode;
};

export function AppShell({
  email,
  searchPlaceholder = "Quick find...",
  sidebarWidth = 228,
  children,
}: Props) {
  const pathname = usePathname();
  return (
    <div className="flex h-screen bg-app text-ink">
      <Sidebar
        pathname={pathname}
        width={sidebarWidth}
        userSlot={<UserMenu email={email} />}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Topbar searchPlaceholder={searchPlaceholder} />
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[940px] px-8 py-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm vitest run components/shell/__tests__/AppShell.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: 커밋**

```bash
git add components/shell/AppShell.tsx components/shell/__tests__/AppShell.test.tsx
git commit -m "feat(wiki): S1-6 AppShell 조립(usePathname + 레이아웃)"
```

---

## Task 7: 기존 화면 셸 통합 + 전체 회귀

**Files:**
- Modify: `app/me/page.tsx`
- Modify: `app/edit/[id]/page.tsx`

- [ ] **Step 1: `/me` 를 AppShell 로 래핑 + Tailwind 클래스화**

`app/me/page.tsx` 전체 교체:

```tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listMyDocuments } from "@/lib/documents/list";
import { createDraftDocument } from "./actions";
import { AppShell } from "@/components/shell/AppShell";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const docs = await listMyDocuments(user.id);

  return (
    <AppShell email={user.email ?? ""}>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="m-0 font-serif text-3xl font-semibold tracking-tight">
          내 문서
        </h1>
        <form action={createDraftDocument}>
          <button
            type="submit"
            className="flex h-[38px] items-center gap-1.5 rounded-md bg-primary px-4 text-[12.5px] font-medium text-primary-fg"
          >
            <Plus size={15} strokeWidth={2.2} /> 새 문서
          </button>
        </form>
      </header>

      {docs.length === 0 ? (
        <p className="text-ink-secondary">
          아직 문서가 없어요. 첫 문서를 만들어보세요.
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-2 p-0">
          {docs.map((d) => (
            <li
              key={d.id}
              className="rounded-lg border border-border bg-surface px-4 py-3"
            >
              <Link href={`/edit/${d.id}`} className="text-ink">
                {d.title || "제목 없는 문서"}
              </Link>
              <span className="ml-2 text-[13px] text-ink-faint">
                {d.project} ·{" "}
                {new Date(d.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
```

- [ ] **Step 2: `/edit/[id]` 를 AppShell(212px) 로 래핑**

`app/edit/[id]/page.tsx` 의 `return` 을 다음으로 교체(상단 import 에 `AppShell` 추가):

```tsx
// import 추가
import { AppShell } from "@/components/shell/AppShell";

// ... (기존 user/doc 로직 그대로) ...

  return (
    <AppShell email={user.email ?? ""} sidebarWidth={212} searchPlaceholder="Search...">
      <Editor id={doc.id} initialTitle={doc.title} initialContent={doc.content} />
    </AppShell>
  );
```

> 참고: 에디터 자체의 헤더/툴바 디자인은 S4 몫이다. S1 에선 기존 `Editor` 를 셸 안에 넣기만 한다.

- [ ] **Step 3: 타입 검사**

Run: `pnpm tsc --noEmit`
Expected: PASS

- [ ] **Step 4: 전체 테스트 (회귀 포함)**

Run: `pnpm test`
Expected: PASS — 신규 셸 테스트(Task 2~6) + 기존 테스트(health 등) 모두 통과. 기존 테스트가 깨지면 **테스트가 아니라 신규 코드를 수정**한다(CLAUDE.md §3).

- [ ] **Step 5: 빌드 스모크**

Run: `pnpm build`
Expected: 빌드 성공(서버 컴포넌트 `/me`·`/edit/[id]` 가 client `AppShell` 을 정상 포함).

- [ ] **Step 6: 커밋**

```bash
git add app/me/page.tsx "app/edit/[id]/page.tsx"
git commit -m "feat(wiki): S1-7 기존 화면(/me, /edit) AppShell 통합"
```

---

## 완료 조건 (S1 전체)

- [ ] `pnpm tsc --noEmit` 통과
- [ ] `pnpm test` 통과 (신규 셸 테스트 + 기존 회귀)
- [ ] `pnpm build` 성공
- [ ] `/me`, `/edit/[id]` 가 공통 셸(사이드바+토픽바) 안에 렌더되고, 네비 활성·로그아웃·Tailwind 토큰이 동작
- [ ] 백로그 항목(Graphs/Templates/Publish)은 비활성으로 자리만 차지

## 셀프 리뷰 노트 (작성자 확인)

- **타입 일관성**: `isActiveNav(href, pathname)` 인자 순서가 `nav.ts`·`Sidebar`·테스트에서 동일.
- **경계**: `Sidebar`/`Topbar`/`UserMenu` 는 prop만 받는 순수 표현(서버/클라 무관), `AppShell` 만 client(`usePathname`). 페이지는 서버에서 `user.email` 주입.
- **YAGNI**: 라우트 그룹 레이아웃·홈 콘텐츠·폴더 트리 데이터는 S1 비범위. 네비의 `/recent` 등 미구현 라우트는 링크만(클릭 시 404는 후속 슬라이스에서 해소) — S1 완료 기준에 포함하지 않음.
- **회귀**: 기존 `lib/documents` 테스트·health 테스트는 변경 없음. layout.tsx 폰트 교체가 기존 기능에 영향 없는지 빌드로 확인.
