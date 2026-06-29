"use client";
import { useRouter } from "next/navigation";

/**
 * 트리 변경 후 서버 컴포넌트 데이터를 갱신하는 refresh 콜백.
 *
 * `useRouter()` 는 AppRouterContext 가 마운트되지 않은 환경(표현 단위 테스트 등)에서
 * invariant 로 throw 한다. 표현 컴포넌트(KnowledgeTree/TreeNodeRow)는 router mock 없이도
 * 렌더 가능해야 하므로(기존 테스트 보존), 컨텍스트 부재를 견디고 no-op 으로 떨어진다.
 * 프로덕션(App Router 마운트)에서는 정상적으로 router.refresh() 를 호출한다.
 */
export function useTreeRefresh(): () => void {
  let router: ReturnType<typeof useRouter> | null = null;
  try {
    router = useRouter();
  } catch {
    router = null;
  }
  return () => {
    router?.refresh();
  };
}
