import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeTabs } from "@/components/home/HomeTabs";

describe("HomeTabs", () => {
  // 스펙: 4개 탭 렌더, Recently edited 활성(aria-current), 나머지 비활성
  it("탭 4개 중 Recently edited 만 활성", () => {
    render(<HomeTabs />);
    for (const t of ["Recently edited", "Starred", "Created by me", "All pages"]) {
      expect(screen.getByText(t)).toBeTruthy();
    }
    expect(screen.getByText("Recently edited").getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Starred").getAttribute("aria-current")).toBeNull();
  });
});
