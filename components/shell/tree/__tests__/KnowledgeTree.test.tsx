import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { KnowledgeTree } from "@/components/shell/tree/KnowledgeTree";
import type { TreeNode } from "@/lib/tree/types";

const nodes: TreeNode[] = [
  {
    kind: "folder", id: "A", name: "Projects", parentId: null, depth: 1, position: 0,
    children: [{ kind: "doc", id: "d1", title: "Doc One", slug: "doc-one", folderId: "A" }],
  },
  { kind: "doc", id: "d2", title: "Root Doc", slug: "root-doc", folderId: null },
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
  // 스펙: 폴더 행에 삭제 트리거(aria-label 으로 식별)가 렌더된다(후속 추가 기능).
  it("폴더 행에 삭제 버튼이 렌더된다", () => {
    render(<KnowledgeTree nodes={nodes} />);
    expect(screen.getByLabelText("Projects 폴더 삭제")).toBeTruthy();
  });
  // 스펙(S5-9 변경): 문서 행 삭제 버튼은 유지하되, Link href 는 읽기 뷰(/p/{slug})로 향한다.
  it("문서 행에 삭제 버튼이 렌더되고 Link href 가 읽기 뷰(/p/slug)로 향한다", () => {
    render(<KnowledgeTree nodes={nodes} />);
    expect(screen.getByLabelText("Root Doc 문서 삭제")).toBeTruthy();
    const link = screen.getByText("Root Doc").closest("a");
    expect(link?.getAttribute("href")).toBe("/p/root-doc");
  });
});
