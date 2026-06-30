# 배포 셋업 — GitHub Actions + Vercel

mywikee를 GitHub Actions(테스트 게이트) → Vercel(prod)로 배포하기 위한 **1회 셋업** 체크리스트.
워크플로우는 `.github/workflows/deploy.yml`. master에 push되면 `tsc`+`test` 통과 후 자동 배포된다.

---

## 1회 셋업

### ① Vercel 프로젝트 생성
1. https://vercel.com → **New Project**
2. GitHub의 **`yangahreum/mywikee`** repo import
3. Framework: **Next.js** 자동 감지 (Root Directory는 그대로 — mywikee 루트가 곧 앱)
4. (첫 import 시 Vercel이 자동 빌드를 시도할 수 있음 — env 등록 후 재배포하면 됨)

### ② Vercel 환경 변수 (Supabase 연결)
프로젝트 **Settings → Environment Variables** (Production)에 등록:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (서버용 키를 쓰면 그것도)

> 로컬 `.env.local`의 값과 동일. 이 키들은 **Vercel에만** 둔다(앱이 쓰는 값).

### ③ Vercel 토큰 / 식별자
1. Vercel 계정 **Settings → Tokens**에서 토큰 발급 → `VERCEL_TOKEN`
2. `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID`:
   - 로컬에서 `npx vercel link`로 프로젝트 연결 후 생기는 **`.vercel/project.json`**에서 확인, 또는
   - Vercel 프로젝트 **Settings → General**에서 Project ID, 계정 설정에서 Org(Team) ID 확인

### ④ GitHub Actions secrets
`yangahreum/mywikee` → **Settings → Secrets and variables → Actions**에 추가:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

> Supabase 키는 GitHub에 둘 필요 없다 — `vercel pull`이 Vercel에서 가져온다. GitHub엔 **Vercel 인증 정보만**.

### ⑤ 커스텀 도메인 — `mywikee.com`
1. Vercel 프로젝트 **Settings → Domains → Add** → `mywikee.com` (원하면 `www.mywikee.com`도)
2. Vercel이 안내하는 **DNS 레코드**를 도메인 등록기관(가비아/Cloudflare 등)에 설정:
   - 루트 `mywikee.com` → **A 레코드** `76.76.21.21` (Vercel 안내값 기준)
   - 또는 `www` → **CNAME** `cname.vercel-dns.com`
3. DNS 전파 후 Vercel이 **SSL 인증서 자동 발급**. `https://mywikee.com` 접속 가능.

> 도메인은 **Vercel 대시보드에서만** 설정한다. 워크플로우(Actions)는 도메인을 건드리지 않는다(배포만).

---

## 동작 / 검증

- **트리거**: master에 push (단, `docs/**`·`*.md`만 바뀌면 배포 스킵).
- **게이트**: `pnpm tsc --noEmit` + `pnpm test` 통과해야만 배포.
- **검증**: 셋업 후 사소한 코드 변경을 master에 push → Actions 탭에서 테스트→배포 확인 → `프로젝트.vercel.app`(또는 `mywikee.com`) 접속 → 로그인/홈/편집/읽기 동작 확인.

## 참고

- **source export**: Vercel 서버리스는 파일 영구 쓰기가 안 된다. `WIKI_ROOT`를 **설정하지 않으면** export 라우트가 503으로 graceful 비활성되고 글은 DB에 보존된다(앱 정상). 배포판에서 export를 쓰려면 Supabase Storage로 전환 필요(후속).
- **DB 마이그레이션**: Supabase 스키마(`folders` 등)는 배포와 별개로 SQL을 직접 적용한다(`docs/setup/*.sql`).
- **e2e 게이트**: 현재 워크플로우는 `tsc`+`test`만. 테스트 유저 env가 준비되면 배포 전 단계에 e2e(anon→인증) 스모크를 추가할 수 있다.
