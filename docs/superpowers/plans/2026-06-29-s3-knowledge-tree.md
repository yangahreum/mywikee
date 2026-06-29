# S3 — 지식 트리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사이드바 KNOWLEDGE TREE를 DB(folders + documents) 기반으로 구현한다 — 최대 4단 폴더 계층, 클릭으로 열기(폴더 토글/문서 이동), 드래그앤드롭 재배치(4단·순환 검증). 사이드바를 청사진 Frame 1(Home·Recent + 트리)로 통일한다.

**Architecture:** depth·순환·드롭 유효성은 `lib/tree/`의 순수 함수로 분리해 TDD. 트리 빌드(`buildTree`)도 순수 함수. `getTree`(서버)가 folders+docs를 조회해 빌드. 사이드바는 `KnowledgeTree`/`TreeNodeRow`(재귀) 표현 컴포넌트가 prop으로 트리를 받아 렌더. 재배치/생성은 서버 액션(`createFolder`/`moveItem`)이 검증 후 DB 갱신. DnD는 `@dnd-kit/core`로 행을 draggable/폴더를 droppable로.

**Tech Stack:** Next.js 16, React 19, Supabase(Postgres+RLS), Tailwind v4, lucide-react, `@dnd-kit/core`, vitest + @testing-library/react.

---

## 배경 / 참고 스펙

- **S3 설계**: `docs/superpowers/specs/2026-06-29-s3-knowledge-tree-design.html` (데이터 모델·4단·DnD·사이드바 통일 §1.1)
- **청사진 트리 픽셀**: `Digital Sanctuary.dc.html` FRAME 1 사이드바 KNOWLEDGE TREE 블록
- **기존**: `set_updated_at()` 함수는 `0001_profiles.sql`에 정의됨(재사용). migrations 현재 0001/0002 → folders는 **0003**.
- **현재 사이드바**: `lib/shell/nav.ts`(NAV_ITEMS 6개), `components/shell/Sidebar.tsx`, `components/shell/AppShell.tsx`(email만). S2 홈은 `app/page.tsx`, 편집은 `app/edit/[id]/page.tsx`.

## 데이터 모델 적용 주의

이 슬라이스는 DB 스키마를 바꾼다. **마이그레이션 SQL을 youllog Supabase에 수동 적용**해야 런타임이 동작한다(QA/사용자). 코드 머지와 별개로 SQL 적용 안내를 남긴다.

---

## Task 1: 마이그레이션 (folders + documents.folder_id)

**Files:** Create `supabase/migrations/0003_folders.sql`, `docs/setup/folders.sql`

- [ ] **Step 1: 정식 마이그레이션 작성** — `supabase/migrations/0003_folders.sql`

```sql
-- wiki — folders 테이블(폴더 계층, 최대 4단) + documents.folder_id + RLS.

CREATE TABLE IF NOT EXISTS public.folders (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id  uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  name       text NOT NULL DEFAULT '새 폴더',
  depth      int  NOT NULL DEFAULT 1 CHECK (depth BETWEEN 1 AND 4),
  position   int  NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_folders_set_updated_at ON public.folders;
CREATE TRIGGER trg_folders_set_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_folders_owner_parent
  ON public.folders (owner_id, parent_id, position);

ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owners full access on own folders" ON public.folders;
CREATE POLICY "owners full access on own folders"
  ON public.folders FOR ALL
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_documents_owner_folder
  ON public.documents (owner_id, folder_id);
```

- [ ] **Step 2: youllog 수동 적용본** — `docs/setup/folders.sql` : 위와 동일하되 상단에 주석으로 "set_updated_at 함수가 이미 있다고 가정(없으면 0001 또는 documents-table.sql 먼저 실행)". 재실행 안전(IF NOT EXISTS / OR REPLACE).

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/0003_folders.sql docs/setup/folders.sql
git commit -m "feat(wiki): S3-1 folders 마이그레이션(4단 계층 + documents.folder_id)"
```

> 이 Task엔 자동 테스트가 없다(SQL). QA 단계에서 실제 적용 후 검증.

---

## Task 2: 트리 타입 + depth/검증 순수 함수 (TDD)

**Files:** Create `lib/tree/types.ts`, `lib/tree/depth.ts`, Test `lib/tree/__tests__/depth.test.ts`

- [ ] **Step 1: 타입** — `lib/tree/types.ts`

```ts
export type FolderRow = {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  position: number;
};

export type DocRow = {
  id: string;
  title: string;
  folderId: string | null;
};

export type TreeFolder = FolderRow & {
  kind: "folder";
  children: TreeNode[];
};
export type TreeDoc = DocRow & { kind: "doc" };
export type TreeNode = TreeFolder | TreeDoc;
```

- [ ] **Step 2: 실패 테스트** — `lib/tree/__tests__/depth.test.ts`

```ts
import { describe, it, expect } from "vitest";
import {
  subtreeHeight,
  isDescendant,
  canDropFolder,
  canCreateChildFolder,
} from "@/lib/tree/depth";
import type { FolderRow } from "@/lib/tree/types";

// 트리: A(1) > B(2) > C(3);  D(1)
const folders: FolderRow[] = [
  { id: "A", name: "A", parentId: null, depth: 1, position: 0 },
  { id: "B", name: "B", parentId: "A", depth: 2, position: 0 },
  { id: "C", name: "C", parentId: "B", depth: 3, position: 0 },
  { id: "D", name: "D", parentId: null, depth: 1, position: 1 },
];

describe("subtreeHeight", () => {
  // 스펙: 노드 포함 서브트리 높이(잎=1). A: A>B>C = 3, C=1
  it("서브트리 높이", () => {
    expect(subtreeHeight("A", folders)).toBe(3);
    expect(subtreeHeight("C", folders)).toBe(1);
  });
});

describe("isDescendant", () => {
  // 스펙: C 는 A 의 자손, A 는 C 의 자손 아님
  it("자손 판정", () => {
    expect(isDescendant("C", "A", folders)).toBe(true);
    expect(isDescendant("A", "C", folders)).toBe(false);
    expect(isDescendant("A", "A", folders)).toBe(true); // 자기 자신 포함
  });
});

describe("canCreateChildFolder", () => {
  // 스펙: depth3 부모 밑엔 생성 가능(→4), depth4 부모 밑엔 불가. 루트(null)는 항상 가능
  it("4단 생성 제약", () => {
    expect(canCreateChildFolder(null, folders)).toBe(true); // 루트 depth1
    expect(canCreateChildFolder("C", folders)).toBe(true); // C depth3 → child depth4 OK
    const deep = [...folders, { id: "E", name: "E", parentId: "C", depth: 4, position: 0 }];
    expect(canCreateChildFolder("E", deep)).toBe(false); // E depth4 → child depth5 불가
  });
});

describe("canDropFolder", () => {
  // 스펙: 폴더 이동 시 (대상 depth + 이동 서브트리 높이) ≤ 4, 순환 금지
  it("이동 유효성", () => {
    // A(높이3)를 D(depth1) 밑으로 → 1+3=4 OK
    expect(canDropFolder("A", "D", folders)).toBe(true);
    // A(높이3)를 C(depth3) 밑으로 → 3+3=6 불가
    expect(canDropFolder("A", "C", folders)).toBe(false);
    // A 를 자기 자손 B 밑으로 → 순환 불가
    expect(canDropFolder("A", "B", folders)).toBe(false);
    // 루트로 이동(null) → 항상 OK
    expect(canDropFolder("C", null, folders)).toBe(true);
  });
});
```

- [ ] **Step 3: 실패 확인** → FAIL

- [ ] **Step 4: 구현** — `lib/tree/depth.ts`

```ts
import type { FolderRow } from "./types";

const MAX_DEPTH = 4;

/** 노드 포함 서브트리 높이(잎 = 1). */
export function subtreeHeight(id: string, folders: FolderRow[]): number {
  const children = folders.filter((f) => f.parentId === id);
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map((c) => subtreeHeight(c.id, folders)));
}

/** candidate 가 ancestor 의 자손인가(자기 자신 포함). */
export function isDescendant(
  candidate: string,
  ancestor: string,
  folders: FolderRow[],
): boolean {
  let cur: string | null = candidate;
  while (cur) {
    if (cur === ancestor) return true;
    cur = folders.find((f) => f.id === cur)?.parentId ?? null;
  }
  return false;
}

function depthOf(id: string | null, folders: FolderRow[]): number {
  if (id === null) return 0; // 루트 위 가상 노드
  return folders.find((f) => f.id === id)?.depth ?? 0;
}

/** parentId 밑에 새 폴더 생성 가능한가(생성 후 depth ≤ 4). */
export function canCreateChildFolder(
  parentId: string | null,
  folders: FolderRow[],
): boolean {
  return depthOf(parentId, folders) + 1 <= MAX_DEPTH;
}

/** folderId 를 targetParentId 밑으로 옮길 수 있는가(4단 + 순환). */
export function canDropFolder(
  folderId: string,
  targetParentId: string | null,
  folders: FolderRow[],
): boolean {
  // 순환: 대상이 자기 자신 또는 자손이면 불가
  if (targetParentId !== null && isDescendant(targetParentId, folderId, folders)) {
    return false;
  }
  return depthOf(targetParentId, folders) + subtreeHeight(folderId, folders) <= MAX_DEPTH;
}
```

- [ ] **Step 5: 통과 확인** → PASS, 그리고 `pnpm tsc --noEmit`

- [ ] **Step 6: 커밋** — `git add lib/tree/types.ts lib/tree/depth.ts lib/tree/__tests__/depth.test.ts` → `feat(wiki): S3-2 트리 depth/순환/드롭 검증 순수 함수`

---

## Task 3: build-tree 순수 함수 (TDD)

**Files:** Create `lib/tree/build-tree.ts`, Test `lib/tree/__tests__/build-tree.test.ts`

- [ ] **Step 1: 실패 테스트**

```ts
import { describe, it, expect } from "vitest";
import { buildTree } from "@/lib/tree/build-tree";
import type { FolderRow, DocRow } from "@/lib/tree/types";

const folders: FolderRow[] = [
  { id: "A", name: "A", parentId: null, depth: 1, position: 1 },
  { id: "B", name: "B", parentId: null, depth: 1, position: 0 },
  { id: "A1", name: "A1", parentId: "A", depth: 2, position: 0 },
];
const docs: DocRow[] = [
  { id: "d1", title: "doc1", folderId: "A" },
  { id: "d2", title: "doc2", folderId: null }, // 루트 문서
];

describe("buildTree", () => {
  // 스펙: 루트 노드는 position 순(B before A), 폴더 children = 하위 폴더 + 문서
  it("계층을 빌드하고 position 으로 정렬한다", () => {
    const tree = buildTree(folders, docs);
    expect(tree.map((n) => n.id)).toEqual(["B", "A", "d2"]); // 폴더(position) 후 루트 문서
    const a = tree.find((n) => n.id === "A");
    expect(a?.kind).toBe("folder");
    if (a?.kind === "folder") {
      expect(a.children.map((c) => c.id)).toEqual(["A1", "d1"]); // 하위 폴더 후 문서
    }
  });
  // 스펙: 빈 입력 → 빈 배열
  it("빈 입력", () => {
    expect(buildTree([], [])).toEqual([]);
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** — `lib/tree/build-tree.ts`

```ts
import type { FolderRow, DocRow, TreeNode, TreeFolder } from "./types";

/**
 * 평면 folders + docs → 계층 TreeNode[].
 * 각 레벨: 폴더(position asc) 먼저, 그 뒤 문서(원래 순서). 루트는 parentId/folderId === null.
 */
export function buildTree(folders: FolderRow[], docs: DocRow[]): TreeNode[] {
  const byParent = (parentId: string | null): TreeNode[] => {
    const folderNodes: TreeFolder[] = folders
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.position - b.position)
      .map((f) => ({ ...f, kind: "folder", children: byParent(f.id) }));
    const docNodes: TreeNode[] = docs
      .filter((d) => d.folderId === parentId)
      .map((d) => ({ ...d, kind: "doc" }));
    return [...folderNodes, ...docNodes];
  };
  return byParent(null);
}
```

- [ ] **Step 4: 통과 확인** → PASS
- [ ] **Step 5: 커밋** — `feat(wiki): S3-3 buildTree 순수 함수`

---

## Task 4: getTree 조회 헬퍼

**Files:** Create `lib/tree/get-tree.ts`, Test `lib/tree/__tests__/get-tree.test.ts`

> Supabase 의존. 매핑 함수(`mapFolderRow`/`mapDocRow`)만 단위 테스트, 실제 쿼리는 QA.

- [ ] **Step 1: 실패 테스트** (매핑)

```ts
import { describe, it, expect } from "vitest";
import { mapFolderRow, mapDocRow } from "@/lib/tree/get-tree";

describe("get-tree 매핑", () => {
  it("folder row 매핑(snake→camel)", () => {
    expect(
      mapFolderRow({ id: "f", name: "F", parent_id: null, depth: 1, position: 2 }),
    ).toEqual({ id: "f", name: "F", parentId: null, depth: 1, position: 2 });
  });
  it("doc row 매핑(null title 방어)", () => {
    expect(mapDocRow({ id: "d", title: null, folder_id: "f" })).toEqual({
      id: "d",
      title: "",
      folderId: "f",
    });
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** — `lib/tree/get-tree.ts`

```ts
import { createClient } from "@/lib/supabase/server";
import { buildTree } from "./build-tree";
import type { FolderRow, DocRow, TreeNode } from "./types";

export function mapFolderRow(r: {
  id: string;
  name: string | null;
  parent_id: string | null;
  depth: number;
  position: number;
}): FolderRow {
  return { id: r.id, name: r.name ?? "", parentId: r.parent_id, depth: r.depth, position: r.position };
}

export function mapDocRow(r: { id: string; title: string | null; folder_id: string | null }): DocRow {
  return { id: r.id, title: r.title ?? "", folderId: r.folder_id };
}

/** owner 의 폴더 트리(폴더 + 문서). 조회 실패 시 빈 배열. */
export async function getTree(ownerId: string): Promise<TreeNode[]> {
  const supabase = await createClient();
  const [{ data: f }, { data: d }] = await Promise.all([
    supabase.from("folders").select("id, name, parent_id, depth, position").eq("owner_id", ownerId),
    supabase.from("documents").select("id, title, folder_id").eq("owner_id", ownerId),
  ]);
  const folders: FolderRow[] = (f ?? []).map(mapFolderRow);
  const docs: DocRow[] = (d ?? []).map(mapDocRow);
  return buildTree(folders, docs);
}
```

- [ ] **Step 4: 통과 확인** → PASS, `pnpm tsc --noEmit`
- [ ] **Step 5: 커밋** — `feat(wiki): S3-4 getTree 조회 헬퍼`

---

## Task 5: 사이드바 통일 — nav 축소 + AppShell/Sidebar tree prop (TDD)

**Files:** Modify `lib/shell/nav.ts`, `lib/shell/__tests__/nav.test.ts`, `components/shell/Sidebar.tsx`, `components/shell/__tests__/Sidebar.test.tsx`, `components/shell/AppShell.tsx`

> **요구사항 변경(스펙 §1.1)**: NAV_ITEMS 6개 → Home·Recent 2개. 이는 신규 기능 충돌이 아니라 의도된 스펙 변경이므로 nav 테스트도 함께 갱신한다.

- [ ] **Step 1: nav 테스트 갱신** — `lib/shell/__tests__/nav.test.ts`의 href 목록을 `["/", "/recent"]`로 수정. (isActiveNav 테스트는 유지)

- [ ] **Step 2: nav.ts 축소** — `NAV_ITEMS`를 Home(`/`)·Recent(`/recent`) 2개로:

```ts
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recent", label: "Recent", icon: History },
];
```

(import에서 미사용 아이콘 Database/Star/Folder/Archive 제거.)

- [ ] **Step 3: Sidebar 에 tree 슬롯 추가** — `components/shell/Sidebar.tsx`에 `treeSlot?: React.ReactNode` prop 추가, 네비 아래 KNOWLEDGE TREE 영역으로 렌더. Sidebar 테스트: 기존 3개 유지하되 네비 검증을 Home/Recent로 수정, `treeSlot` 렌더 케이스 1개 추가.

```tsx
// Props 에 추가: treeSlot?: React.ReactNode;
// 네비(<nav>) 다음, userSlot 위에:
{treeSlot && <div className="mt-4 flex-1 overflow-y-auto">{treeSlot}</div>}
```

- [ ] **Step 4: AppShell 에 tree prop** — `components/shell/AppShell.tsx`:

```tsx
// Props 에 추가: tree?: import("@/lib/tree/types").TreeNode[];
// 기본 sidebarWidth 228 유지. Sidebar 에 treeSlot 전달:
//   treeSlot={<KnowledgeTree nodes={tree ?? []} />}  ← Task 6 컴포넌트
```

> Task 6에서 `KnowledgeTree`를 만든 뒤 이 import를 연결한다. Task 5에서는 `treeSlot`을 `tree`가 있으면 placeholder(예: null)로 두고, Task 6에서 KnowledgeTree로 교체해도 된다. **권장: Task 6을 먼저 만들고 Task 5 Step 4에서 연결.** (구현 순서: Task 6 → Task 5 Step 4. 계획서 번호와 무관하게 의존성 우선.)

- [ ] **Step 5: 통과 확인** — `pnpm vitest run lib/shell components/shell` → 갱신된 테스트 PASS. `pnpm tsc --noEmit`.

- [ ] **Step 6: 커밋** — `git add lib/shell/nav.ts lib/shell/__tests__/nav.test.ts components/shell/Sidebar.tsx components/shell/__tests__/Sidebar.test.tsx components/shell/AppShell.tsx` → `feat(wiki): S3-5 사이드바 통일(nav 축소 + tree 슬롯)`

---

## Task 6: KnowledgeTree + TreeNodeRow 표현 컴포넌트 (TDD)

**Files:** Create `components/shell/tree/KnowledgeTree.tsx`, `components/shell/tree/TreeNodeRow.tsx`, Test `components/shell/tree/__tests__/KnowledgeTree.test.tsx`

청사진 참조: FRAME 1 KNOWLEDGE TREE 블록 — 라벨 `10.5/600/.09em/ink-faint` + `plus-square`(14); 폴더 행 h32 `chevron-down|right`(15)+`folder`(15)+이름(13); 문서 행 h31 `file-text`(14)+제목; 들여쓰기 depth 증가; 활성 `bg-chip`.

- [ ] **Step 1: 실패 테스트** — `KnowledgeTree.test.tsx`

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KnowledgeTree } from "@/components/shell/tree/KnowledgeTree";
import type { TreeNode } from "@/lib/tree/types";

const nodes: TreeNode[] = [
  {
    kind: "folder", id: "A", name: "Projects", parentId: null, depth: 1, position: 0,
    children: [{ kind: "doc", id: "d1", title: "Doc One", folderId: "A" }],
  },
  { kind: "doc", id: "d2", title: "Root Doc", folderId: null },
];

describe("KnowledgeTree", () => {
  // 스펙: 라벨 + 루트 폴더/문서 렌더
  it("KNOWLEDGE TREE 라벨과 노드를 렌더한다", () => {
    render(<KnowledgeTree nodes={nodes} />);
    expect(screen.getByText("KNOWLEDGE TREE")).toBeTruthy();
    expect(screen.getByText("Projects")).toBeTruthy();
    expect(screen.getByText("Root Doc")).toBeTruthy();
  });
  // 스펙: 폴더는 기본 펼침 → 하위 문서가 보인다(초기 expanded 가정). 빈 트리 빈상태.
  it("폴더 하위 문서를 렌더한다", () => {
    render(<KnowledgeTree nodes={nodes} />);
    expect(screen.getByText("Doc One")).toBeTruthy();
  });
  it("빈 트리는 안내 문구", () => {
    render(<KnowledgeTree nodes={[]} />);
    expect(screen.getByText(/폴더가 없습니다|\+ 로 만들기/)).toBeTruthy();
  });
});
```

- [ ] **Step 2: 실패 확인** → FAIL

- [ ] **Step 3: 구현** — 청사진 픽셀로. 펼침 상태는 클라이언트(`useState`), 기본 전체 펼침. 문서 클릭 `/edit/{id}`. plus-square = 루트 폴더 생성(Task 7 액션 연결, Step에선 자리). 들여쓰기 = depth별 `paddingLeft`.

`TreeNodeRow.tsx` (재귀, "use client"):

```tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Folder, FileText } from "lucide-react";
import type { TreeNode } from "@/lib/tree/types";

export function TreeNodeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const pad = 8 + depth * 14; // 들여쓰기

  if (node.kind === "doc") {
    return (
      <Link
        href={`/edit/${node.id}`}
        style={{ paddingLeft: pad + 21 }}
        className="flex h-[31px] items-center gap-2 rounded-md pr-3 text-[13px] text-ink-secondary hover:bg-chip"
      >
        <FileText size={14} strokeWidth={1.7} /> {node.title || "제목 없는 문서"}
      </Link>
    );
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ paddingLeft: pad }}
        className="flex h-8 w-full items-center gap-2 rounded-md pr-3 text-[13px] font-medium text-ink hover:bg-chip"
      >
        {open ? <ChevronDown size={15} strokeWidth={2} /> : <ChevronRight size={15} strokeWidth={2} />}
        <Folder size={15} strokeWidth={1.7} /> {node.name}
      </button>
      {open && node.children.map((c) => <TreeNodeRow key={c.id} node={c} depth={depth + 1} />)}
    </div>
  );
}
```

`KnowledgeTree.tsx`:

```tsx
import { PlusSquare } from "lucide-react";
import type { TreeNode } from "@/lib/tree/types";
import { TreeNodeRow } from "./TreeNodeRow";

export function KnowledgeTree({ nodes }: { nodes: TreeNode[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1.5 text-[10.5px] font-semibold tracking-[0.09em] text-ink-faint">
        KNOWLEDGE TREE
        <PlusSquare size={14} strokeWidth={1.7} className="cursor-pointer" />
      </div>
      {nodes.length === 0 ? (
        <p className="px-1.5 text-[12px] text-ink-faint">폴더가 없습니다. + 로 만들기.</p>
      ) : (
        <div className="flex flex-col gap-px">
          {nodes.map((n) => <TreeNodeRow key={n.id} node={n} depth={0} />)}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: 통과 확인** → PASS (3 tests). 그 다음 **Task 5 Step 4**로 돌아가 AppShell이 `KnowledgeTree`를 `treeSlot`으로 연결.
- [ ] **Step 5: 커밋** — `git add components/shell/tree/` → `feat(wiki): S3-6 KnowledgeTree/TreeNodeRow 표현 컴포넌트`

---

## Task 7: 서버 액션 createFolder / moveItem (TDD on 검증부)

**Files:** Create `app/tree/actions.ts`, (검증 로직은 Task 2 depth.ts 재사용 — 추가 순수 테스트 불필요)

- [ ] **Step 1: 구현** — `app/tree/actions.ts`. getUser 가드 + zod + depth 검증(Task 2 함수) + owner 이중조건.

```ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canCreateChildFolder, canDropFolder } from "@/lib/tree/depth";
import type { FolderRow } from "@/lib/tree/types";

async function loadFolders(supabase: Awaited<ReturnType<typeof createClient>>, ownerId: string): Promise<FolderRow[]> {
  const { data } = await supabase
    .from("folders").select("id, name, parent_id, depth, position").eq("owner_id", ownerId);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, parentId: r.parent_id, depth: r.depth, position: r.position }));
}

const CreateInput = z.object({ parentId: z.string().uuid().nullable(), name: z.string().max(100).optional() });

export async function createFolder(parentId: string | null, name?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthorized" };
  const parsed = CreateInput.safeParse({ parentId, name });
  if (!parsed.success) return { ok: false as const, error: "validation" };

  const folders = await loadFolders(supabase, user.id);
  if (!canCreateChildFolder(parentId, folders)) return { ok: false as const, error: "depth_exceeded" };
  const depth = parentId ? (folders.find((f) => f.id === parentId)!.depth + 1) : 1;

  const { error } = await supabase.from("folders").insert({
    owner_id: user.id, parent_id: parentId, name: name ?? "새 폴더", depth,
  });
  if (error) return { ok: false as const, error: "db_error" };
  revalidatePath("/");
  return { ok: true as const };
}

const MoveInput = z.object({
  kind: z.enum(["folder", "doc"]),
  id: z.string().uuid(),
  targetParentId: z.string().uuid().nullable(),
});

export async function moveItem(input: z.infer<typeof MoveInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthorized" };
  const parsed = MoveInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "validation" };
  const { kind, id, targetParentId } = parsed.data;

  if (kind === "doc") {
    const { error } = await supabase.from("documents")
      .update({ folder_id: targetParentId }).eq("id", id).eq("owner_id", user.id);
    if (error) return { ok: false as const, error: "db_error" };
  } else {
    const folders = await loadFolders(supabase, user.id);
    if (!canDropFolder(id, targetParentId, folders)) return { ok: false as const, error: "depth_exceeded_or_cycle" };
    const newDepth = targetParentId ? (folders.find((f) => f.id === targetParentId)!.depth + 1) : 1;
    // 서브트리 depth 일괄 재계산
    const delta = newDepth - folders.find((f) => f.id === id)!.depth;
    const ids = collectSubtree(id, folders);
    await supabase.from("folders").update({ parent_id: targetParentId, depth: newDepth }).eq("id", id).eq("owner_id", user.id);
    for (const sub of ids.filter((x) => x !== id)) {
      const cur = folders.find((f) => f.id === sub)!;
      await supabase.from("folders").update({ depth: cur.depth + delta }).eq("id", sub).eq("owner_id", user.id);
    }
  }
  revalidatePath("/");
  return { ok: true as const };
}

function collectSubtree(rootId: string, folders: FolderRow[]): string[] {
  const out = [rootId];
  for (const f of folders.filter((x) => x.parentId === rootId)) out.push(...collectSubtree(f.id, folders));
  return out;
}
```

- [ ] **Step 2: 검증** — `pnpm tsc --noEmit` 통과(검증 로직 단위 테스트는 Task 2가 커버). 

- [ ] **Step 3: 커밋** — `git add app/tree/actions.ts` → `feat(wiki): S3-7 createFolder/moveItem 서버 액션(4단·순환 검증)`

---

## Task 8: @dnd-kit DnD 통합

**Files:** Modify `components/shell/tree/KnowledgeTree.tsx`, `TreeNodeRow.tsx`; `package.json`

- [ ] **Step 1: 설치** — `pnpm add @dnd-kit/core`

- [ ] **Step 2: DnD 래핑** — `KnowledgeTree`를 `<DndContext>`로 감싸고, `TreeNodeRow`의 행을 `useDraggable`(id=node id, data={kind}), 폴더 행(+루트 영역)을 `useDroppable`(id=folder id 또는 "root")로. `onDragEnd`에서 `moveItem({kind, id, targetParentId})` 호출 → 성공 시 `router.refresh()`.

   - 드롭 전 `canDropFolder`(폴더) 결과로 over 상태 하이라이트/거부 표시.
   - 문서는 depth 무관, 폴더로 드롭만.

> DnD는 단위 테스트가 어렵다. 드롭 유효성 판정은 이미 Task 2(`canDropFolder`)로 테스트됨. 실제 드래그 동작은 **QA/수동 검증**. 구현 시 @dnd-kit 공식 패턴(`DndContext`/`useDraggable`/`useDroppable`/`onDragEnd`)을 따른다.

- [ ] **Step 3: 검증** — `pnpm tsc --noEmit` + `pnpm test`(기존 트리 표현 테스트가 DnD 래핑 후에도 통과하는지 — 렌더 구조 유지). 깨지면 테스트가 깨지지 않게 DnD를 표현에 비침습적으로 얹는다.

- [ ] **Step 4: 커밋** — `git add components/shell/tree/ package.json pnpm-lock.yaml` → `feat(wiki): S3-8 트리 드래그앤드롭 재배치(@dnd-kit)`

---

## Task 9: 페이지 통합 + 전체 회귀

**Files:** Modify `app/page.tsx`, `app/edit/[id]/page.tsx`

- [ ] **Step 1: 홈 통합** — `app/page.tsx`에서 `getTree(user.id)` 조회 → `<AppShell ... tree={tree}>`.

- [ ] **Step 2: 에디터 통합** — `app/edit/[id]/page.tsx`에서도 `getTree(user.id)` → `<AppShell ... tree={tree} sidebarWidth={228}>` (212→228 통일, variant="bare" 유지).

- [ ] **Step 3: 타입** — `pnpm tsc --noEmit` PASS

- [ ] **Step 4: 전체 테스트** — `pnpm test` → 신규 트리 테스트 + 갱신된 nav/Sidebar + 기존 전부 PASS. 회귀 시 신규 코드 수정.

- [ ] **Step 5: 빌드** — `pnpm build` → `/`·`/edit/[id]`가 트리 포함 셸로 컴파일.

- [ ] **Step 6: 커밋** — `git add app/page.tsx "app/edit/[id]/page.tsx"` → `feat(wiki): S3-9 트리 페이지 통합(/ , /edit)`

---

## 완료 조건 (S3 전체)

- [ ] `pnpm tsc --noEmit` / `pnpm test` / `pnpm build` 통과
- [ ] (마이그레이션 적용 후) 사이드바에 DB 기반 트리 표시, 폴더 생성, 문서/폴더 드래그 이동, 4단·순환 거부
- [ ] 사이드바 Home/Recent + 트리로 통일, 에디터도 동일 폭(228)

## 마이그레이션 적용 안내 (코드 머지 후)

`docs/setup/folders.sql`을 youllog Supabase SQL 에디터에서 1회 실행해야 런타임 동작. 미적용 시 트리는 빈 상태(조회 빈 배열로 graceful)지만 폴더 생성/이동은 실패.

## 셀프 리뷰 노트

- **타입 일관성**: `FolderRow{id,name,parentId,depth,position}`·`DocRow`·`TreeNode`가 depth/build-tree/get-tree/컴포넌트/액션에서 동일. `canDropFolder(folderId, targetParentId, folders)` 인자 순서 일관.
- **의존 순서**: Task 6(KnowledgeTree) → Task 5 Step 4(AppShell 연결). 구현 시 이 순서.
- **회귀(의도된 변경)**: nav.ts 축소로 nav/Sidebar 테스트를 갱신 — 스펙 §1.1 요구사항 변경이므로 테스트 동기화가 맞다(신규 충돌 회피와 구분).
- **DnD 한계**: 단위 테스트는 유효성 판정(canDropFolder)까지. 실제 드래그는 QA/수동. moveItem의 서브트리 depth 갱신은 루프 — 폴더 수가 적어 허용(대량은 후속 최적화).
- **YAGNI**: 이름변경·삭제·Favorites/Archive·펼침 영속화는 비범위.
