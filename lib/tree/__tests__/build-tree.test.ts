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
