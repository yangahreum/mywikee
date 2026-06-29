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
