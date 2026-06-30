---
name: nextjs-build-orchestrator
description: Next.js/TS 구현 계획을 에이전트 팀으로 실행할 때 사용하는 오케스트레이터. 구현자·리뷰어·QA 3인 팀을 꾸려 계획의 Task를 생성-검증 루프로 진행한다. "계획 실행", "구현 시작", "Task 진행", "이 plan 실행해", "다음 Task", "팀으로 구현", 그리고 후속 표현 "다시 실행", "재실행", "이어서 구현", "수정 반영", "특정 Task만 다시", "이전 결과 기반으로" 에 모두 적용한다. 단순 질문/단일 파일 확인은 팀 없이 직접 응답해도 된다.
---

# Next.js Build Orchestrator

`docs/superpowers/plans/*.md` 구현 계획을 **에이전트 팀**으로 실행한다. 누가(에이전트)·어떻게(스킬)는 각 정의에 있고, 이 스킬은 **누가 언제 어떤 순서로 협업하는가**를 정의한다.

## 팀 구성

| 에이전트 | 타입 | 스킬 | 역할 |
|---|---|---|---|
| `nextjs-implementer` | general-purpose | nextjs-tdd-implementation | Task를 TDD로 구현 |
| `code-reviewer` | general-purpose | code-review-checklist | diff 독립 리뷰 |
| `qa-verifier` | general-purpose | nextjs-qa-verification | 실행·회귀·경계면 검증 |

모든 에이전트 호출에 `model: "opus"` 를 명시한다. 실행 모드는 **에이전트 팀**(`TeamCreate` + `TaskCreate`).

## Phase 0: 컨텍스트 확인 (시작 시 항상)

기존 산출물을 확인해 실행 모드를 정한다.
- `_workspace/` 없음 → **초기 실행**: 계획 첫 Task부터.
- `_workspace/` 있음 + 사용자가 "N번 Task만 다시"/"리뷰 반영" → **부분 재실행**: 해당 Task만 루프.
- `_workspace/` 있음 + 새 계획/새 입력 → **새 실행**: 기존 `_workspace/` 를 `_workspace_prev/` 로 옮기고 시작.
- 어디까지 커밋됐는지 `git log` 로 확인해 다음 Task를 정한다.

## Phase 1: 팀 구성

`TeamCreate` 로 3인 팀을 만들고, 리더(오케스트레이터)가 계획을 읽어 Task 목록을 파악한다. `TaskCreate` 로 계획의 Task들을 의존 순서대로 등록한다(대개 Task N은 N-1 완료에 의존).

## Phase 2: Task별 생성-검증 루프

각 Task에 대해 순서대로:

1. **구현** — `nextjs-implementer` 에게 Task 1개 할당(계획 경로 + Task 번호 + 직전 피드백). 산출 보고 수신.
2. **리뷰** — `code-reviewer` 에게 그 Task의 diff 리뷰 요청. PASS/CHANGES_REQUESTED 수신.
   - CHANGES_REQUESTED → 지적을 `nextjs-implementer` 에 전달해 수정 → 재리뷰. (최대 2회 반복, 그래도 안 되면 리더가 사용자에게 보고)
3. **QA** — 리뷰 PASS 후 `qa-verifier` 에게 실행 검증 요청(tsc/test + 경계면 + 회귀). 결함 발견 시 implementer 수정 → 재QA.
4. **체크포인트** — Task가 깨끗이 끝나면 리더가 사용자에게 1줄 보고하고 다음 Task로. 사용자가 멈추거나 방향을 바꿀 수 있다.

리뷰와 QA를 분리하는 이유: 정적 결함(리뷰)과 실행 결함(QA)은 다른 시각에서 잡힌다. 구현자와도 분리해 자기검증 편향을 막는다.

## 데이터 전달 프로토콜

- **태스크 기반**(`TaskCreate`/`TaskUpdate`): 진행 상황·의존 관계 추적.
- **메시지 기반**(`SendMessage`): 리뷰/QA 지적을 구현자에게 실시간 전달, 수정 회신.
- **파일 기반**: 코드 자체가 산출물(git). 중간 리포트가 크면 `_workspace/{NN}_{agent}_{artifact}.md` 에 저장하고 보존(감사 추적). 최종 산출물은 계획대로 커밋.

## 에러 핸들링

- 에이전트 실패: 1회 재시도. 재실패 시 그 Task를 멈추고 전체 출력과 함께 사용자에게 보고 — 다음 Task로 임의로 넘어가지 않는다(의존성 때문).
- 리뷰·QA 무한 핑퐁: 같은 Task에서 수정 2회 후에도 PASS 못 하면 멈추고 사용자 판단을 받는다.
- 환경 결함(Supabase 미연결, `WIKI_ROOT` 부재): 코드 결함과 구분해 보고하고, 해당 검증은 미검증으로 표시(통과로 적지 않음).
- 상충하는 보고(리뷰는 OK인데 QA는 실패): 삭제·은폐하지 말고 양쪽을 병기해 사용자에게 보고.

## 커밋 안전

이 프로젝트는 `/Users/areumyang/IdeaProjects` 공유 모노레포의 하위 폴더다. `git add -A` 금지 — 항상 계획에 명시된 파일 경로만 명시 추가한다. 브랜치 전략(전용 브랜치 vs master 단독 커밋)은 첫 Task 전에 사용자에게 확인한다.

## 테스트 시나리오

**정상 흐름:** "계획 실행해" → Phase 0(초기 실행 판별) → 팀 구성 → Task 1 구현→리뷰 PASS→QA PASS→체크포인트 보고 → Task 2 … → 전체 완료 후 종합 보고 + 피드백 요청.

**에러 흐름:** Task 9(에디터) 구현 후 QA가 "export 라우트 반환 `{path}` ↔ editor.tsx가 `body.url` 소비" 경계면 불일치 발견 → implementer에 전달 → 수정 → 재QA PASS → 다음 진행. (수정 2회 실패 시 사용자에게 보고.)

## 완료 후
전체 완료 시 사용자에게 결과를 종합 보고하고 피드백을 요청한다("워크플로우/팀 구성에서 바꿀 점이 있나요?"). 반복되는 피드백은 하네스 진화로 연결한다(CLAUDE.md 변경 이력에 기록).
