# CLAUDE.md — wiki 프로젝트 정책

## 1. 언어 / 출력

- 답변과 과정은 모두 반드시 **한글**로 출력한다.

## 2. 설계 → 구현 → 검증 흐름

- 모든 구현을 진행할 때는 반드시 우선 계획을 세우고 설계를 **HTML 문서**로 기록한 후 시작한다.
- 모든 설계문서 최상단에는 표 형식의 기능정의를 우선 작성하고 나머지 내용을 정리한다.
- 모든 설계문서 최상단에는 기능정의 표와 매칭되는 작업내용을 표형식으로 작성하고 이 테스크를 기준으로 구현을 진행한다.
  - 기능에 따라 작업이 여러개로 쪼개질수 있음.
- 설계 문서는 사용자가 바로 열어볼 수 있도록 **전체 풀 패스**에 link 를 걸어 제공한다.
- 코드 작성 전 반드시 사용자 리뷰를 받고 승인 후 다음 작업을 진행한다 (단계별 리뷰).

## 3. 회귀 검증 (vitest)
- 코드 작성 시 반드시 테스트 케이스 (vitest) 를 작성하고 해당 동작을 주석으로 남겨 정확한 동작이 무엇이고 에러가 없는지 확인한다.
- 테스트 케이스 검증 시 **이전 케이스도 같이 검증**하여 현재 수정이 이전 기능에 영향을 주는지 확인. 영향을 주는 경우 다시 수정한다.
- 검증시 반드시 스펙문서의 기능정의 표와 작업목록을 대조하여 모든 기능이 누락없이 구현되었는지 확인한다.
- 신규 구현한 기능 때문에 이전 테스트 코드가 제대로 동작하지 않는 경우 **절대 테스트 케이스를 수정하지 말고 신규 구현 코드를 수정**한다.
- 매 슬라이스 완료 조건: `pnpm tsc --noEmit` + `pnpm test` 둘 다 통과.

## 4. 폴더 / 버전 정책
- 기능이 추가/변경될 때마다 이전 버전 스펙을 새 문서에 복사 후 수정해서 버전별로 관리 — `vN-YYYY-MM-DD-<summary>.html`.
- 각 `vN` = 그 시점의 전체 명세. 이전 `vN` 은 freeze (이력 보존).

## 5. 외부 wiki 동기화 (Lazy 모드 — 2026-06-22)

### 원칙

- **`docs/` 가 원본 진실의 출처.** 기능 구현 (코드 + 테스트 + 검증) 은 `docs/` 의 HTML 스펙만으로 진행 가능 — wiki 는 메인 흐름과 독립.
- **wiki 는 외부 참조 미러.** 사용자가 다른 PC / AI 도구 / 외부 환경에서 프로젝트 문서를 참조할 때 사용. wiki 가 일시 stale 해도 코드/기능 흐름엔 영향 0.

### 위치 / 형식

- 본 프로젝트에서 생성되는 **모든 문서 (스펙 / 참조 / 작업 보고서)** 는 `/Users/areumyang/AI/wiki/<project-name>/` 에 프로젝트별 폴더로 두고 **md 파일로 동기화**한다.
  - wiki 프로젝트 → `/Users/areumyang/AI/wiki/wiki/`
- 형식: `docs/` 의 HTML 원본은 그대로. `wiki/` 의 md 는 같은 내용의 마크다운 변환본.
- 폴더 구조는 `docs/` 를 미러 — 예: `docs/superpowers/specs/utility-blocks/table/v1-...html` ↔ `wiki/<project>/specs/utility-blocks/table/v1-....md`.

### 동기화 시점 (Lazy)

- **즉시 sync 의무 없음.** 매 슬라이스의 메인 흐름 (구현 + 테스트 + 사용자 검증) 을 끊지 않는다.
- **사용자가 명시 요청할 때만 일괄 동기화.**
  - 명시 trigger 예: "wiki sync 해" / "이번 주 작업 wiki 정리해" / "stale 한 docs/ retro 동기화" / "지금까지 작업 wiki 에 반영해"
  - retro 시 일괄 변환 도구 (pandoc 등) 사용 가능 — 1초~수분 처리.
- 사용자 trigger 가 없으면 wiki 는 stale 한 상태로 둔다. retro 시점에 사용자가 직접 결정.

### 무엇이 sync 대상인가

- 스펙 (`docs/superpowers/specs/` 의 HTML)
- 참조 문서 (`docs/reference/`)
- 작업 보고서 (슬라이스 완료 시점의 결과 정리 — 사용자가 명시 요청 시 생성)
- 메모리 (`~/.claude/.../memory/`) 는 **sync 대상 아님** — 사용자별 컨텍스트, 프로젝트 wiki 와 무관

## 6. 하네스: Next.js/TS 구현 팀

**목표:** Next.js + TS + Supabase + BlockNote 구현 계획을 생성-검증 루프로 안전하게 구현한다.

**에이전트 팀:**
| 에이전트 | 역할 |
|---------|------|
| `nextjs-implementer` | 계획 Task를 TDD로 구현 (Next.js/TS, Supabase, BlockNote) |
| `code-reviewer` | 구현 diff 독립 리뷰 (계획준수·인증·타입·테스트 품질) |
| `qa-verifier` | tsc/test/e2e 실행 + 회귀 + 경계면 교차 검증 |

**스킬:**
| 스킬 | 용도 | 사용 에이전트 |
|------|------|-------------|
| `nextjs-tdd-implementation` | TDD 구현 규약 | nextjs-implementer |
| `code-review-checklist` | 정적 리뷰 체크리스트 | code-reviewer |
| `nextjs-qa-verification` | 실행·회귀·경계면 검증 | qa-verifier |
| `nextjs-build-orchestrator` | 팀 구성·Task 루프 조율 | (리더/오케스트레이터) |

**실행 규칙:**
- 구현 계획(`docs/superpowers/plans/*.md`) 실행·Task 진행·재실행·수정 반영 요청 시 `nextjs-build-orchestrator` 스킬로 에이전트 팀을 통해 처리한다.
- 단순 질문/단일 파일 확인은 팀 없이 직접 응답해도 된다.
- 모든 에이전트는 `model: "opus"` 사용.
- 중간 산출물: `_workspace/` 디렉토리(보존). 커밋은 계획 명시 파일만 명시 추가(공유 모노레포이므로 `git add -A` 금지).

**디렉토리 구조:**
```
.claude/
├── agents/
│   ├── nextjs-implementer.md
│   ├── code-reviewer.md
│   └── qa-verifier.md
└── skills/
    ├── nextjs-tdd-implementation/SKILL.md
    ├── code-review-checklist/SKILL.md
    ├── nextjs-qa-verification/SKILL.md
    └── nextjs-build-orchestrator/SKILL.md
```

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-06-28 | 초기 구성 (3인 분산 팀) | 전체 | Next.js/TS 구현 하네스 신규 구축 |
