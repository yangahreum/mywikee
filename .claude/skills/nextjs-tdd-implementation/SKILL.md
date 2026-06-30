---
name: nextjs-tdd-implementation
description: Next.js(App Router) + TypeScript + Supabase + BlockNote 코드를 TDD로 구현할 때 사용. 구현 계획의 Task 실행, 서버 액션/라우트 핸들러 작성, Supabase 연동, RSC/Client 경계 처리, vitest 테스트 작성 시 반드시 이 스킬을 따른다. "Task 구현", "이 기능 만들어", "다음 Task 진행", "구현 이어서", "수정 반영" 등의 요청에 적용.
---

# Next.js TDD 구현

이 프로젝트(Next.js 16 App Router + React 19 + TS + Supabase + BlockNote)에서 **한 번에 하나의 계획 Task**를 TDD로 구현하는 방법을 정의한다. 목표는 동작이 검증된 작은 변경을 자주 커밋하는 것이다.

## TDD 루프 (Task마다)

순서를 지키는 이유: 테스트를 먼저 실패시켜 봐야 그 테스트가 "실제로 무언가를 검증한다"는 보장이 생긴다. 구현 후 작성한 테스트는 구현을 베껴 항상 통과하는 무의미한 테스트가 되기 쉽다.

1. **실패 테스트 작성** — 계획 Task의 테스트 코드를 작성한다.
2. **실패 확인** — `pnpm test <경로>` 로 "올바른 이유로" 실패하는지 본다(모듈 없음/동작 불일치). 엉뚱한 이유(오타)면 테스트를 고친다.
3. **최소 구현** — 테스트를 통과시키는 최소 코드만 쓴다. 계획에 없는 기능을 미리 만들지 않는다(YAGNI).
4. **통과 확인** — `pnpm test <경로>` 통과.
5. **타입체크** — `pnpm tsc` 통과.
6. **커밋** — 계획에 명시된 파일만 `git add <경로>` 로 명시 추가 후 커밋. (이 저장소는 공유 모노레포이므로 `git add -A` 금지.)

순수 로직(유틸·변환·검증)은 반드시 이 루프를 탄다. 스캐폴딩/설정 파일은 테스트가 어려우므로 작성 후 `pnpm tsc`(+가능하면 build)로 검증한다.

## 프로젝트 규약

### 인증 / 인가
- 모든 쓰기·민감 조회는 서버 액션(`"use server"`) 또는 라우트 핸들러에서 처리한다.
- 진입부에서 `const { data: { user } } = await supabase.auth.getUser();` 가드. 없으면 `redirect("/login")`(페이지) 또는 401(API).
- 쓰기 쿼리는 RLS에 더해 `.eq("owner_id", user.id)` 를 **명시**해 이중 보호한다.
- `owner_id` 는 항상 서버에서 `user.id` 로 결정한다. 클라이언트 입력을 신뢰하지 않는다.

### 입력 검증
- 외부에서 들어오는 값(액션 인자, 쿼리 파라미터)은 zod로 검증한다.
- 파일 경로에 들어가는 세그먼트(project/slug 등)는 `[a-z0-9-]` 화이트리스트로 검증해 path traversal을 막는다.

### RSC / Client 경계
- 기본은 서버 컴포넌트. `useState`/`useEffect`/이벤트 핸들러/브라우저 API가 필요할 때만 `"use client"`.
- 서버 비밀(서비스 롤 키 등)은 클라이언트 번들에 절대 노출하지 않는다. 클라이언트엔 `NEXT_PUBLIC_*` 만.
- BlockNote 에디터는 SSR에서 깨지므로 `dynamic(() => import(...), { ssr: false })` 로 로드한다.

### Supabase
- 클라이언트 컴포넌트: `lib/supabase/client.ts` 의 `createClient()`.
- 서버(컴포넌트/액션/라우트): `lib/supabase/server.ts` 의 `await createClient()`.
- 세션 갱신은 `middleware.ts` 가 담당 — 서버 클라이언트에서 쿠키 set 실패는 정상(try/catch).

### 테스트
- vitest. 테스트는 `**/__tests__/**/*.test.ts(x)` 에 둔다(vitest.config include와 일치).
- 각 테스트에 **무엇을 검증하는지** 한국어로 명확히 쓴다(it 설명). 동작 의도를 주석으로 남겨 스펙과 대조 가능하게 한다.
- 엣지/실패 경로를 포함한다(빈 입력, 안전하지 않은 경로, 권한 없음 등).
- **신규 구현이 기존 테스트를 깨면 기존 테스트를 고치지 말고 신규 코드를 고친다.** 의도된 동작 변경이면 멈추고 보고한다.

## 막혔을 때
- 명령 1회 재시도 후 재실패하면 추측으로 우회하지 말고 전체 에러와 함께 보고한다.
- 계획의 코드/시그니처가 틀렸다고 판단되면 임의로 바꾸지 말고 보고한다 — 계획 변경은 사람의 결정이다.

## 산출 보고
구현 후 반드시: 변경 파일 목록 / 작성 테스트와 의도 / `pnpm tsc`·`pnpm test` 결과 / 커밋 메시지 / 계획과의 차이를 보고한다.
