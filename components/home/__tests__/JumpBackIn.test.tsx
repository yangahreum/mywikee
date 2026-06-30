import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JumpBackIn } from "@/components/home/JumpBackIn";

const docs = [
  { id: "1", title: "Systems Architecture", slug: "systems-architecture", project: "Projects", updatedAt: "2026-06-29T10:00:00Z" },
  { id: "2", title: "Cognitive Load", slug: "cognitive-load", project: "Research", updatedAt: "2026-06-29T07:00:00Z" },
];
const NOW = new Date("2026-06-29T12:00:00Z");

describe("JumpBackIn", () => {
  // 스펙: 라벨 + 각 문서 카드(제목, "프로젝트 · Edited Nh ago") 렌더
  it("문서 카드를 렌더한다", () => {
    render(<JumpBackIn docs={docs} now={NOW} />);
    expect(screen.getByText("JUMP BACK IN")).toBeTruthy();
    expect(screen.getByText("Systems Architecture")).toBeTruthy();
    expect(screen.getByText(/Projects · Edited 2h ago/)).toBeTruthy();
  });
  // 스펙(S5-9 변경): 카드 클릭은 읽기 뷰(/p/{slug})로 향한다.
  it("카드 Link href 가 읽기 뷰(/p/slug)로 향한다", () => {
    render(<JumpBackIn docs={docs} now={NOW} />);
    const link = screen.getByText("Systems Architecture").closest("a");
    expect(link?.getAttribute("href")).toBe("/p/systems-architecture");
  });
  // 스펙: 문서 0건이면 섹션을 렌더하지 않는다(null)
  it("문서가 없으면 아무것도 렌더하지 않는다", () => {
    const { container } = render(<JumpBackIn docs={[]} now={NOW} />);
    expect(container.querySelector("a")).toBeNull();
    expect(screen.queryByText("JUMP BACK IN")).toBeNull();
  });
});
