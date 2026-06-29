import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentlyEditedTable } from "@/components/home/RecentlyEditedTable";

const docs = [
  { id: "1", title: "Systems Architecture", project: "Projects", updatedAt: "2026-06-29T10:00:00Z" },
];
const NOW = new Date("2026-06-29T12:00:00Z");

describe("RecentlyEditedTable", () => {
  // 스펙: 컬럼 헤더 + 행(제목, 브레드크럼, 태그칩=project대문자, 상대시각)
  it("문서 행을 렌더한다", () => {
    render(<RecentlyEditedTable docs={docs} now={NOW} />);
    expect(screen.getByText("NAME")).toBeTruthy();
    expect(screen.getByText("Systems Architecture")).toBeTruthy();
    expect(screen.getByText("Knowledge Base / Projects")).toBeTruthy();
    expect(screen.getByText("PROJECTS")).toBeTruthy(); // 태그칩 = project 대문자
    expect(screen.getByText("2h ago")).toBeTruthy();
  });
  // 스펙: 문서 0건이면 빈 상태 메시지
  it("빈 상태 메시지", () => {
    render(<RecentlyEditedTable docs={[]} now={NOW} />);
    expect(screen.getByText(/아직 문서가 없어요/)).toBeTruthy();
  });
  // 스펙: project 가 빈 문자열이면 태그칩을 렌더하지 않는다
  it("project 없으면 태그칩 생략", () => {
    render(
      <RecentlyEditedTable
        docs={[{ id: "2", title: "무제", project: "", updatedAt: "2026-06-29T10:00:00Z" }]}
        now={NOW}
      />,
    );
    expect(screen.queryByText("Knowledge Base /")).toBeNull();
  });
});
