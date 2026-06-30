# LLM-Wiki Source Editor 구현 계획 (MVP 첫 슬라이스)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 웹 블록 에디터로 문서를 작성·자동저장(Supabase)하고, 저장된 문서를 BlockNote 내장 익스포터로 HTML 변환해 LLM-Wiki의 `sources/`에 파일로 생성하는 다중 사용자 위키의 첫 수직 슬라이스를 구현한다.

**Architecture:** Next.js(App Router) + React + TypeScript. 인증/저장은 Supabase(@supabase/ssr, Auth+Postgres+RLS). 에디터는 BlockNote 기본 스키마/툴바. "로그인 → 내 문서 목록/생성 → 기본 에디터 + 디바운스 자동저장 → source 생성(HTML 파일 쓰기)"의 한 바퀴. 편집 진실은 `documents.content`(BlockNote `Block[]` JSON), HTML은 그로부터 파생되는 export 산출물. 파일 쓰기는 `WIKI_ROOT`가 설정된 로컬/자체호스팅에서만 활성.

**Tech Stack:** Next.js 16.2.6, React 19, TypeScript 5, BlockNote 0.51.x(`@blocknote/core`,`/react`,`/mantine`,`/server-util`), Supabase(`@supabase/ssr`,`@supabase/supabase-js`), zod, pnpm, vitest, Playwright.

**참고 스펙:** `/Users/areumyang/IdeaProjects/wiki/docs/superpowers/specs/2026-06-27-llm-wiki-source-editor-design.html`

**참고 코드베이스:** `/Users/areumyang/IdeaProjects/youllog` (동일 스택. 인증·미들웨어·자동저장·RLS 패턴을 미러링).

---

## 파일 구조

```
wiki/
├── package.json                         # 의존성·스크립트
├── next.config.ts                       # devIndicators:false
├── tsconfig.json                        # paths @/* → ./
├── vitest.config.ts                     # happy-dom + @ alias
├── .env.example                         # 환경변수 키(값은 비움)
├── middleware.ts                        # Supabase 세션 갱신
├── app/
│   ├── layout.tsx                       # 루트 레이아웃(폰트/기본 마크업)
│   ├── page.tsx                         # 홈 → /me 리다이렉트
│   ├── login/page.tsx                   # 매직링크 로그인
│   ├── auth/confirm/route.ts            # token_hash 검증
│   ├── auth/sign-out/route.ts           # 로그아웃
│   ├── me/page.tsx                      # 내 문서 목록
│   ├── me/actions.ts                    # createDraftDocument
│   ├── edit/[id]/page.tsx               # 에디터 진입(서버: 인증+로드)
│   ├── edit/[id]/editor.tsx             # 클라이언트 오케스트레이터(제목+자동저장)
│   ├── edit/[id]/blocknote.tsx          # 기본 BlockNote 래퍼
│   ├── edit/[id]/actions.ts             # saveDocument 서버액션
│   └── api/
│       ├── health/route.ts              # 헬스체크
│       └── documents/[id]/export/route.ts  # source 생성(HTML 파일 쓰기)
├── lib/
│   ├── supabase/client.ts               # 브라우저 클라이언트
│   ├── supabase/server.ts               # 서버 클라이언트
│   ├── supabase/middleware.ts           # updateSession
│   ├── documents/
│   │   ├── types.ts                     # Document 타입 + zod
│   │   ├── get.ts                        # getDocument
│   │   ├── list.ts                       # listMyDocuments
│   │   ├── slug.ts                       # slugify (TDD)
│   │   └── export-path.ts                # 경로 조합 + traversal 가드 (TDD)
│   └── export/
│       └── html.ts                       # ServerBlockNoteEditor → HTML
├── supabase/migrations/
│   ├── 0001_profiles.sql
│   └── 0002_documents.sql
└── e2e/
    └── flow.spec.ts
```

**책임 경계:**
- `lib/documents/slug.ts`, `export-path.ts` — 순수 함수. 외부 의존 없음. 단위 테스트 대상.
- `lib/export/html.ts` — BlockNote 서버 변환 캡슐화. 단위 스모크 테스트.
- `lib/supabase/*` — 클라이언트 팩토리. youllog와 동일.
- `app/edit/[id]/*` — 에디터 UI + 자동저장. 파일 분리(서버 진입 / 오케스트레이터 / BlockNote 래퍼 / 액션).

---

## Task 1: 프로젝트 스캐폴드 (의존성·설정)

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `vitest.config.ts`, `.env.example`, `app/layout.tsx`, `app/page.tsx`

- [ ] **Step 1: package.json 작성**

Create `package.json`:

```json
{
  "name": "wiki",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "tsc": "tsc --noEmit",
    "e2e": "playwright test"
  },
  "dependencies": {
    "@blocknote/core": "^0.51.3",
    "@blocknote/mantine": "^0.51.3",
    "@blocknote/react": "^0.51.3",
    "@blocknote/server-util": "^0.51.3",
    "@supabase/ssr": "^0.10.3",
    "@supabase/supabase-js": "^2.106.2",
    "next": "16.2.6",
    "pretendard": "^1.3.9",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@playwright/test": "^1.61.0",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^6.0.2",
    "eslint": "^9",
    "eslint-config-next": "16.2.6",
    "happy-dom": "^20.10.2",
    "typescript": "^5",
    "vitest": "^4.1.8"
  }
}
```

- [ ] **Step 2: 설정 파일 작성**

Create `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default nextConfig;
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `vitest.config.ts`:

```typescript
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(__dirname, "./") } },
  test: {
    environment: "happy-dom",
    include: [
      "lib/**/__tests__/**/*.test.ts",
      "lib/**/__tests__/**/*.test.tsx",
      "app/**/__tests__/**/*.test.ts",
    ],
    globals: true,
  },
});
```

- [ ] **Step 3: .env.example 작성 (실제 키 값 절대 커밋 금지)**

Create `.env.example`:

```env
# Supabase (자신의 프로젝트 값으로 채우고 .env.local 로 복사)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# source 생성(HTML 파일 쓰기) 대상 LLM-Wiki 볼트 루트.
# 설정되지 않으면 export 라우트는 비활성(글은 DB 에 그대로 보존).
WIKI_ROOT="/Users/areumyang/AI/wiki"
```

- [ ] **Step 4: 루트 레이아웃 + 홈**

Create `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import "pretendard/dist/web/static/pretendard.css";

export const metadata: Metadata = {
  title: "wiki — source editor",
  description: "LLM-Wiki source 문서 편집기",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          fontFamily:
            "Pretendard, -apple-system, BlinkMacSystemFont, sans-serif",
          color: "#111315",
          background: "#ffffff",
        }}
      >
        {children}
      </body>
    </html>
  );
}
```

Create `app/page.tsx`:

```typescript
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/me");
}
```

- [ ] **Step 5: 의존성 설치 + 타입체크**

Run:
```bash
cd /Users/areumyang/IdeaProjects/wiki && pnpm install
```
Expected: 설치 성공, `node_modules/` 생성.

Run:
```bash
pnpm tsc
```
Expected: 에러 없음(또는 아직 생성 안 된 파일 참조 없음 — 이 시점 파일만으로 통과).

- [ ] **Step 6: 커밋**

```bash
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json vitest.config.ts .env.example app/layout.tsx app/page.tsx
git commit -m "chore(wiki): scaffold Next.js + Supabase + BlockNote project"
```

---

## Task 2: Supabase 클라이언트 + 미들웨어

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`, `middleware.ts`

- [ ] **Step 1: 브라우저 클라이언트**

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from "@supabase/ssr";

/** 클라이언트 컴포넌트(브라우저)용 Supabase 팩토리. SSR 에서 사용 금지. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: 서버 클라이언트**

Create `lib/supabase/server.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** 서버 컴포넌트/액션/라우트핸들러용 Supabase 팩토리. 세션 갱신은 미들웨어 담당. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서는 set 이 throw — 미들웨어가 갱신 담당.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 3: 미들웨어 헬퍼 + 루트 미들웨어**

Create `lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 매 요청마다 세션 쿠키 검사/갱신. createServerClient 와 getUser() 사이에 코드 금지. */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
```

Create `middleware.ts` (프로젝트 루트):

```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 4: 타입체크 + 커밋**

Run: `pnpm tsc`
Expected: 에러 없음.

```bash
git add lib/supabase middleware.ts
git commit -m "feat(wiki): add Supabase clients and session middleware"
```

---

## Task 3: DB 마이그레이션 (profiles + documents + RLS)

**Files:**
- Create: `supabase/migrations/0001_profiles.sql`, `supabase/migrations/0002_documents.sql`

- [ ] **Step 1: profiles 마이그레이션**

Create `supabase/migrations/0001_profiles.sql`:

```sql
-- wiki — profiles 테이블 + updated_at 트리거 + 신규가입 자동생성 + RLS

CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname    text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles readable by anyone" ON public.profiles;
CREATE POLICY "profiles readable by anyone"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
CREATE POLICY "users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "users can insert own profile" ON public.profiles;
CREATE POLICY "users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.profiles (id, nickname)
SELECT id, split_part(COALESCE(email, 'user'), '@', 1)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
```

- [ ] **Step 2: documents 마이그레이션**

Create `supabase/migrations/0002_documents.sql`:

```sql
-- wiki — documents 테이블 + RLS. 편집 진실 = content(BlockNote Block[] JSON).

CREATE TABLE IF NOT EXISTS public.documents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project    text NOT NULL DEFAULT 'default',
  title      text NOT NULL DEFAULT '',
  slug       text UNIQUE NOT NULL,
  content    jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_documents_set_updated_at ON public.documents;
CREATE TRIGGER trg_documents_set_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_documents_owner_created
  ON public.documents (owner_id, created_at DESC);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 각 사용자는 자기 문서만 전체 접근 (멀티테넌트 공유 배포)
DROP POLICY IF EXISTS "owners full access on own documents" ON public.documents;
CREATE POLICY "owners full access on own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
```

- [ ] **Step 3: Supabase 프로젝트에 마이그레이션 적용**

> 실행자 메모: Supabase SQL Editor 또는 `supabase db push`(supabase CLI 링크 시)로 두 파일을 순서대로 적용한다. 적용 후 `documents`, `profiles` 테이블과 RLS 활성 여부를 대시보드에서 확인.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations
git commit -m "feat(wiki): add profiles and documents migrations with RLS"
```

---

## Task 4: 헬스체크 라우트

**Files:**
- Create: `app/api/health/route.ts`, `app/api/health/__tests__/health.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

Create `app/api/health/__tests__/health.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("GET /api/health", () => {
  it("status ok 를 200 으로 반환한다", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test app/api/health`
Expected: FAIL — `../route` 모듈 없음.

- [ ] **Step 3: 라우트 구현**

Create `app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok" });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test app/api/health`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add app/api/health
git commit -m "feat(wiki): add health check route"
```

---

## Task 5: 인증 흐름 (로그인 / confirm / 로그아웃)

**Files:**
- Create: `app/login/page.tsx`, `app/auth/confirm/route.ts`, `app/auth/sign-out/route.ts`

- [ ] **Step 1: 로그인 페이지**

Create `app/login/page.tsx`:

```typescript
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }
    setStatus("sent");
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "80px 24px" }}>
      <h1 style={{ fontSize: 32, margin: "0 0 24px" }}>로그인</h1>
      {status === "sent" ? (
        <p>메일함을 확인하세요. 매직링크를 보냈습니다.</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{ padding: "10px 12px", border: "1px solid #c9ced4", borderRadius: 6 }}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            style={{ padding: "10px 12px", background: "#1f5d4f", color: "#fff", border: "none", borderRadius: 6 }}
          >
            {status === "sending" ? "보내는 중…" : "매직링크 받기"}
          </button>
          {status === "error" && <p style={{ color: "#b00" }}>{errorMsg}</p>}
        </form>
      )}
    </main>
  );
}
```

- [ ] **Step 2: confirm 라우트 (token_hash 흐름 + open redirect 방어)**

Create `app/auth/confirm/route.ts`:

```typescript
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const rawNext = searchParams.get("next");

  const safeNext =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/me";

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/login?error=missing_token`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash, type });

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }
  return NextResponse.redirect(`${origin}${safeNext}`);
}
```

- [ ] **Step 3: 로그아웃 라우트**

Create `app/auth/sign-out/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { origin } = new URL(request.url);
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
```

- [ ] **Step 4: 타입체크 + 커밋**

Run: `pnpm tsc`
Expected: 에러 없음.

```bash
git add app/login app/auth
git commit -m "feat(wiki): magic-link auth (login, confirm, sign-out)"
```

---

## Task 6: 문서 데이터 라이브러리 (타입 / 조회 / 목록)

**Files:**
- Create: `lib/documents/types.ts`, `lib/documents/get.ts`, `lib/documents/list.ts`

- [ ] **Step 1: 타입 + zod 스키마**

Create `lib/documents/types.ts`:

```typescript
import { z } from "zod";

/**
 * BlockNote 기본 스키마의 block 배열. MVP 에서는 구조 전체를 엄격 검증하지 않고
 * "객체 배열" 수준만 보장한다(엄격 블록 검증은 후속 슬라이스). content 의 진실은 에디터.
 */
export const BlocksSchema = z.array(z.record(z.string(), z.unknown()));
export type Blocks = z.infer<typeof BlocksSchema>;

export type DocumentRecord = {
  id: string;
  ownerId: string;
  project: string;
  title: string;
  slug: string;
  content: Blocks;
  createdAt: string;
  updatedAt: string;
};
```

- [ ] **Step 2: 단일 문서 조회**

Create `lib/documents/get.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { BlocksSchema, type DocumentRecord } from "./types";

/** 본인 소유 문서 1건 조회. 없거나 타인 문서면 null (RLS + 명시 owner 가드). */
export async function getDocument(
  id: string,
  ownerId: string,
): Promise<DocumentRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, owner_id, project, title, slug, content, created_at, updated_at")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .single();

  if (error || !data) return null;

  const content = BlocksSchema.safeParse(data.content);
  return {
    id: data.id,
    ownerId: data.owner_id,
    project: data.project,
    title: data.title,
    slug: data.slug,
    content: content.success ? content.data : [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
```

- [ ] **Step 3: 내 문서 목록**

Create `lib/documents/list.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";

export type DocumentListItem = {
  id: string;
  title: string;
  project: string;
  createdAt: string;
};

/** 내 문서 목록(최신순). */
export async function listMyDocuments(
  ownerId: string,
): Promise<DocumentListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, project, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((d) => ({
    id: d.id,
    title: d.title,
    project: d.project,
    createdAt: d.created_at,
  }));
}
```

- [ ] **Step 4: 타입체크 + 커밋**

Run: `pnpm tsc`
Expected: 에러 없음.

```bash
git add lib/documents/types.ts lib/documents/get.ts lib/documents/list.ts
git commit -m "feat(wiki): document data lib (types, get, list)"
```

---

## Task 7: slug / export-path 순수 유틸 (TDD)

**Files:**
- Create: `lib/documents/slug.ts`, `lib/documents/export-path.ts`
- Test: `lib/documents/__tests__/slug.test.ts`, `lib/documents/__tests__/export-path.test.ts`

- [ ] **Step 1: slug 실패 테스트 작성**

Create `lib/documents/__tests__/slug.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { slugify } from "../slug";

describe("slugify", () => {
  it("영문 제목을 소문자 하이픈 슬러그로 변환한다", () => {
    expect(slugify("My First Doc")).toBe("my-first-doc");
  });
  it("연속 공백/기호를 단일 하이픈으로 접고 양끝 하이픈을 제거한다", () => {
    expect(slugify("  Hello --- World!!  ")).toBe("hello-world");
  });
  it("ASCII 슬러그를 만들 수 없으면(예: 한글만) 빈 문자열을 반환한다", () => {
    expect(slugify("한글 제목")).toBe("");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test lib/documents/__tests__/slug`
Expected: FAIL — `../slug` 없음.

- [ ] **Step 3: slugify 구현**

Create `lib/documents/slug.ts`:

```typescript
/**
 * 제목을 파일명용 ASCII 슬러그로 변환.
 * - 소문자화, [a-z0-9] 외 문자는 하이픈으로, 연속 하이픈 접기, 양끝 하이픈 제거.
 * - ASCII 결과가 비면 ""(호출부에서 문서 slug 로 폴백). 한글 슬러그는 후속 슬라이스.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: slug 테스트 통과 확인**

Run: `pnpm test lib/documents/__tests__/slug`
Expected: PASS.

- [ ] **Step 5: export-path 실패 테스트 작성**

Create `lib/documents/__tests__/export-path.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { isSafeSegment, buildExportPath } from "../export-path";

describe("isSafeSegment", () => {
  it("[a-z0-9-] 로만 이뤄진 세그먼트를 허용한다", () => {
    expect(isSafeSegment("my-doc-2")).toBe(true);
  });
  it("슬래시/점/대문자/빈값을 거부한다", () => {
    expect(isSafeSegment("a/b")).toBe(false);
    expect(isSafeSegment("..")).toBe(false);
    expect(isSafeSegment("Doc")).toBe(false);
    expect(isSafeSegment("")).toBe(false);
  });
});

describe("buildExportPath", () => {
  it("{root}/{project}/sources/{file}.html 경로를 만든다", () => {
    expect(buildExportPath("/w", "default", "my-doc")).toBe(
      "/w/default/sources/my-doc.html",
    );
  });
  it("안전하지 않은 project/file 은 throw 한다 (path traversal 방어)", () => {
    expect(() => buildExportPath("/w", "../etc", "x")).toThrow();
    expect(() => buildExportPath("/w", "default", "../../x")).toThrow();
  });
});
```

- [ ] **Step 6: export-path 테스트 실패 확인**

Run: `pnpm test lib/documents/__tests__/export-path`
Expected: FAIL — `../export-path` 없음.

- [ ] **Step 7: export-path 구현**

Create `lib/documents/export-path.ts`:

```typescript
/** 파일 경로 세그먼트 안전성: [a-z0-9-] 만 허용(슬래시/점/.. 차단). */
export function isSafeSegment(segment: string): boolean {
  return /^[a-z0-9-]+$/.test(segment);
}

/**
 * source 파일 절대 경로 조합: {wikiRoot}/{project}/sources/{file}.html
 * project/file 이 안전하지 않으면 throw (path traversal 방어).
 */
export function buildExportPath(
  wikiRoot: string,
  project: string,
  file: string,
): string {
  if (!isSafeSegment(project)) {
    throw new Error(`unsafe project segment: ${project}`);
  }
  if (!isSafeSegment(file)) {
    throw new Error(`unsafe file segment: ${file}`);
  }
  const root = wikiRoot.replace(/\/+$/, "");
  return `${root}/${project}/sources/${file}.html`;
}
```

- [ ] **Step 8: 전체 테스트 통과 확인 + 커밋**

Run: `pnpm test lib/documents`
Expected: PASS (slug + export-path 모두).

```bash
git add lib/documents/slug.ts lib/documents/export-path.ts lib/documents/__tests__
git commit -m "feat(wiki): slug and export-path utils with tests"
```

---

## Task 8: 내 문서 목록 페이지 + 새 문서 생성

**Files:**
- Create: `app/me/page.tsx`, `app/me/actions.ts`

- [ ] **Step 1: createDraftDocument 서버 액션**

Create `app/me/actions.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 빈 draft 문서 생성 후 에디터로 이동.
 * - owner_id 는 서버에서 결정(auth.uid()). slug 는 draft-{8hex} 자동 생성.
 * - UNIQUE(slug) 충돌(23505) 시 1회 재시도.
 */
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

    if (!error && data) {
      createdId = data.id;
      break;
    }
    if (error?.code !== "23505") {
      console.error("[createDraftDocument] insert error:", error);
      throw new Error("새 문서 만들기에 실패했어요.");
    }
  }
  if (!createdId) throw new Error("슬러그 생성 실패. 다시 시도해주세요.");

  redirect(`/edit/${createdId}`);
}
```

- [ ] **Step 2: 목록 페이지**

Create `app/me/page.tsx`:

```typescript
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyDocuments } from "@/lib/documents/list";
import { createDraftDocument } from "./actions";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const docs = await listMyDocuments(user.id);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px" }}>
      <header
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}
      >
        <h1 style={{ fontSize: 26, margin: 0 }}>내 문서</h1>
        <form action={createDraftDocument}>
          <button
            type="submit"
            style={{ padding: "8px 14px", background: "#1f5d4f", color: "#fff", border: "none", borderRadius: 6 }}
          >
            새 문서 만들기
          </button>
        </form>
      </header>

      {docs.length === 0 ? (
        <p style={{ color: "#5a6066" }}>아직 문서가 없어요. 첫 문서를 만들어보세요.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map((d) => (
            <li key={d.id} style={{ border: "1px solid #e3e6ea", borderRadius: 8, padding: "12px 16px" }}>
              <Link href={`/edit/${d.id}`}>{d.title || "제목 없는 문서"}</Link>
              <span style={{ color: "#9098a0", fontSize: 13, marginLeft: 8 }}>
                {d.project} · {new Date(d.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
```

- [ ] **Step 3: 타입체크 + 커밋**

Run: `pnpm tsc`
Expected: 에러 없음.

```bash
git add app/me
git commit -m "feat(wiki): my documents list and create-draft action"
```

---

## Task 9: 에디터 (기본 BlockNote + 자동저장)

**Files:**
- Create: `app/edit/[id]/page.tsx`, `app/edit/[id]/blocknote.tsx`, `app/edit/[id]/editor.tsx`, `app/edit/[id]/actions.ts`

- [ ] **Step 1: saveDocument 서버 액션**

Create `app/edit/[id]/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BlocksSchema, type Blocks } from "@/lib/documents/types";

export type SaveResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "validation" | "not_found" | "db_error" };

const SaveInput = z.object({
  id: z.string().uuid(),
  title: z.string().max(200),
  content: BlocksSchema,
});

export async function saveDocument(
  id: string,
  title: string,
  content: Blocks,
): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = SaveInput.safeParse({ id, title, content });
  if (!parsed.success) return { ok: false, error: "validation" };

  const { data, error } = await supabase
    .from("documents")
    .update({ title: parsed.data.title, content: parsed.data.content })
    .eq("id", parsed.data.id)
    .eq("owner_id", user.id)
    .select("id")
    .single();

  if (error) {
    if (error.code === "PGRST116") return { ok: false, error: "not_found" };
    console.error("[saveDocument] db error:", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "not_found" };

  revalidatePath("/me");
  return { ok: true };
}
```

- [ ] **Step 2: 기본 BlockNote 래퍼 (클라이언트)**

Create `app/edit/[id]/blocknote.tsx`:

```typescript
"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { Blocks } from "@/lib/documents/types";

type Props = {
  initialContent: Blocks;
  onChange: (blocks: Blocks) => void;
};

/**
 * 기본 BlockNote 에디터(커스텀 블록/직렬화기 없음).
 * - initialContent 가 비어있으면 BlockNote 가 throw 하므로 undefined 로 전달.
 * - onChange 는 editor.document(Block[]) 를 그대로 상위로 올린다.
 */
export function BlockNoteEditor({ initialContent, onChange }: Props) {
  const editor = useCreateBlockNote({
    initialContent:
      initialContent.length > 0
        ? // BlockNote PartialBlock[] 호환. 저장된 Block[] 를 그대로 사용.
          (initialContent as never)
        : undefined,
  });

  return (
    <BlockNoteView
      editor={editor}
      onChange={() => onChange(editor.document as unknown as Blocks)}
    />
  );
}
```

- [ ] **Step 3: 에디터 오케스트레이터 (제목 + 디바운스 자동저장 + export 버튼)**

Create `app/edit/[id]/editor.tsx`:

```typescript
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Blocks } from "@/lib/documents/types";
import { saveDocument } from "./actions";

const BlockNoteEditor = dynamic(
  () => import("./blocknote").then((m) => m.BlockNoteEditor),
  { ssr: false },
);

const DEBOUNCE_MS = 1500;
type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  id: string;
  initialTitle: string;
  initialContent: Blocks;
};

export function Editor({ id, initialTitle, initialContent }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<Blocks>(initialContent);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(
    async (t: string, c: Blocks) => {
      setStatus("saving");
      const res = await saveDocument(id, t, c);
      setStatus(res.ok ? "saved" : "error");
    },
    [id],
  );

  const requestSave = useCallback(
    (t: string, c: Blocks) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void doSave(t, c);
      }, DEBOUNCE_MS);
    },
    [doSave],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onTitle = (next: string) => {
    setTitle(next);
    setStatus("idle");
    requestSave(next, content);
  };
  const onBlocks = useCallback(
    (next: Blocks) => {
      setContent(next);
      setStatus("idle");
      requestSave(title, next);
    },
    [title, requestSave],
  );

  async function onExport() {
    setExportMsg("생성 중…");
    const res = await fetch(`/api/documents/${id}/export`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setExportMsg(
      res.ok ? `생성됨: ${body.path}` : `실패: ${body.error ?? res.status}`,
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 120px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ color: "#9098a0", fontSize: 13 }}>
          {status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : status === "error" ? "저장 실패" : ""}
        </span>
        <button
          type="button"
          onClick={onExport}
          style={{ padding: "6px 12px", border: "1px solid #c9ced4", borderRadius: 6, background: "#fff" }}
        >
          source 생성
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        style={{ fontSize: 36, fontWeight: 800, border: "none", outline: "none", width: "100%", marginBottom: 24 }}
      />

      <BlockNoteEditor initialContent={initialContent} onChange={onBlocks} />

      {exportMsg && <p style={{ color: "#5a6066", marginTop: 16 }}>{exportMsg}</p>}
    </main>
  );
}
```

- [ ] **Step 4: 에디터 진입 페이지 (서버: 인증 + 로드)**

Create `app/edit/[id]/page.tsx`:

```typescript
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDocument } from "@/lib/documents/get";
import { Editor } from "./editor";

type Props = { params: Promise<{ id: string }> };

export default async function EditPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const doc = await getDocument(id, user.id);
  if (!doc) notFound();

  return (
    <Editor id={doc.id} initialTitle={doc.title} initialContent={doc.content} />
  );
}
```

- [ ] **Step 5: 타입체크 + 커밋**

Run: `pnpm tsc`
Expected: 에러 없음.

```bash
git add app/edit
git commit -m "feat(wiki): document editor with default BlockNote and autosave"
```

---

## Task 10: HTML export 라이브러리 + source 생성 API

**Files:**
- Create: `lib/export/html.ts`, `app/api/documents/[id]/export/route.ts`
- Test: `lib/export/__tests__/html.test.ts`

- [ ] **Step 1: HTML 변환 실패 테스트 작성**

Create `lib/export/__tests__/html.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { blocksToHtml } from "../html";

describe("blocksToHtml", () => {
  it("문단 블록의 텍스트를 포함하는 HTML 문자열을 만든다", async () => {
    const blocks = [
      {
        type: "paragraph",
        content: [{ type: "text", text: "안녕 위키", styles: {} }],
      },
    ];
    const html = await blocksToHtml(blocks as never);
    expect(typeof html).toBe("string");
    expect(html).toContain("안녕 위키");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm test lib/export`
Expected: FAIL — `../html` 없음.

- [ ] **Step 3: HTML 변환 구현 (BlockNote 서버 유틸, 기본 스키마)**

Create `lib/export/html.ts`:

```typescript
import { ServerBlockNoteEditor } from "@blocknote/server-util";
import type { Blocks } from "@/lib/documents/types";

/**
 * BlockNote Block[] → 완전한 HTML 문자열. 기본 스키마(커스텀 블록 없음)이므로
 * ServerBlockNoteEditor 기본 인스턴스로 변환. 서버 사이드 전용.
 */
export async function blocksToHtml(blocks: Blocks): Promise<string> {
  const editor = ServerBlockNoteEditor.create();
  return await editor.blocksToFullHTML(blocks as never);
}
```

> 실행자 메모: `blocksToFullHTML` 이 설치된 `@blocknote/server-util` 버전에 없으면 동일 인스턴스의 `blocksToHTMLLossy` 로 대체하고 테스트를 다시 통과시킨다(둘 다 full/lossy HTML 문자열 반환).

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test lib/export`
Expected: PASS (HTML 에 "안녕 위키" 포함).

- [ ] **Step 5: source 생성 API 라우트**

Create `app/api/documents/[id]/export/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createClient } from "@/lib/supabase/server";
import { getDocument } from "@/lib/documents/get";
import { slugify } from "@/lib/documents/slug";
import { buildExportPath, isSafeSegment } from "@/lib/documents/export-path";
import { blocksToHtml } from "@/lib/export/html";

/**
 * source 생성: 문서 → HTML → {WIKI_ROOT}/{project}/sources/{file}.html 기록.
 * - WIKI_ROOT 미설정 시 비활성(503). 글은 DB 에 보존.
 * - 파일명 = slugify(title) || 문서 slug. project/file 은 traversal 가드.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const wikiRoot = process.env.WIKI_ROOT;
  if (!wikiRoot) {
    return NextResponse.json(
      { error: "export_disabled: WIKI_ROOT not set" },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const doc = await getDocument(id, user.id);
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const file = slugify(doc.title) || doc.slug;
  if (!isSafeSegment(doc.project) || !isSafeSegment(file)) {
    return NextResponse.json({ error: "unsafe_path" }, { status: 400 });
  }

  let targetPath: string;
  try {
    targetPath = buildExportPath(wikiRoot, doc.project, file);
  } catch {
    return NextResponse.json({ error: "unsafe_path" }, { status: 400 });
  }

  try {
    const html = await blocksToHtml(doc.content);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, html, "utf-8");
  } catch (e) {
    console.error("[export] write failed:", e);
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path: targetPath });
}
```

- [ ] **Step 6: 타입체크 + 전체 테스트 + 커밋**

Run: `pnpm tsc && pnpm test`
Expected: 타입 에러 없음, 모든 테스트 PASS.

```bash
git add lib/export app/api/documents
git commit -m "feat(wiki): source export (BlockNote HTML -> sources/ file)"
```

---

## Task 11: E2E 한 바퀴 (Playwright)

**Files:**
- Create: `playwright.config.ts`, `e2e/flow.spec.ts`

> 실행자 메모: 매직링크는 자동 E2E 가 까다롭다. MVP E2E 는 **인증을 전제로 하지 않는 스모크**(홈→/me 리다이렉트→/login 도달, /api/health 200)만 자동화한다. 인증 후 전체 흐름(생성→편집→자동저장→export)은 수동 검증 체크리스트로 둔다(아래 Step 3).

- [ ] **Step 1: Playwright 설정**

Create `playwright.config.ts`:

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
```

- [ ] **Step 2: 스모크 E2E**

Create `e2e/flow.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test("health 엔드포인트가 ok 를 반환한다", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe("ok");
});

test("미인증 사용자는 /me 접근 시 /login 으로 리다이렉트된다", async ({ page }) => {
  await page.goto("/me");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
});
```

- [ ] **Step 3: E2E 실행**

Run: `pnpm e2e`
Expected: 2개 테스트 PASS.

수동 검증 체크리스트(인증 필요):
1. `/login` 에서 이메일 입력 → 매직링크 수신 → 클릭 → `/me` 도달.
2. "새 문서 만들기" → `/edit/{id}` 진입.
3. 제목/본문 입력 → 1.5초 후 "저장됨" 표시. 새로고침 시 내용 유지.
4. "source 생성" 클릭 → `WIKI_ROOT/default/sources/{slug}.html` 파일 생성 확인.

- [ ] **Step 4: 커밋**

```bash
git add playwright.config.ts e2e
git commit -m "test(wiki): smoke e2e (health, auth redirect)"
```

---

## 완료 조건 (전체)

- `pnpm tsc` 통과, `pnpm test` 전부 통과, `pnpm e2e` 스모크 통과.
- 수동 검증 체크리스트(Task 11 Step 3) 통과.
- 한 바퀴 데모: 로그인 → 문서 생성 → 편집/자동저장 → source 생성(HTML 파일).

## 후속 슬라이스 (이번 범위 밖, 설계 §7 참조)

- 이미지 업로드(Supabase Storage + BlockNote `uploadFile`)
- 프로젝트 관리 UI(`project` 텍스트 → 테이블/선택 UI), 한글 슬러그 지원
- 커스텀 시맨틱 직렬화기(인제스트 품질 향상 시), 공개 읽기/공유, AI 작성 보조, Git 연동 export
- export 시 HTML 상단 메타(created/tags/source) 포함 여부
