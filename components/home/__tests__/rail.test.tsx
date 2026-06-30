import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Starred } from "@/components/home/rail/Starred";
import { RecentActivity } from "@/components/home/rail/RecentActivity";
import { QuickAccess } from "@/components/home/rail/QuickAccess";

const NOW = new Date("2026-06-29T12:00:00Z");

describe("rail/Starred", () => {
  // 스펙: 즐겨찾기 미구현 → 빈 상태 메시지
  it("빈 상태", () => {
    render(<Starred />);
    expect(screen.getByText("Starred")).toBeTruthy();
    expect(screen.getByText(/즐겨찾기/)).toBeTruthy();
  });
});

describe("rail/RecentActivity", () => {
  // 스펙: 최근 문서 → "Updated \"제목\" · 시각" 활동으로 표시
  it("최근 문서를 활동으로 표시", () => {
    render(
      <RecentActivity
        docs={[{ id: "1", title: "Bio Interface", slug: "bio-interface", project: "P", updatedAt: "2026-06-29T10:00:00Z" }]}
        now={NOW}
      />,
    );
    expect(screen.getByText("Recent activity")).toBeTruthy();
    expect(screen.getByText(/Updated "Bio Interface"/)).toBeTruthy();
    expect(screen.getByText(/2h ago/)).toBeTruthy();
  });
});

describe("rail/QuickAccess", () => {
  // 스펙: 4개 백로그 항목, 전부 aria-disabled
  it("백로그 항목은 비활성", () => {
    render(<QuickAccess />);
    for (const l of ["Global Graph", "Reading Queue", "Canvas Mode", "Collections"]) {
      expect(screen.getByText(l).getAttribute("aria-disabled")).toBe("true");
    }
  });
});
