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
