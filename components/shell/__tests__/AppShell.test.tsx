import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// next/navigation usePathname 모킹 (happy-dom)
const mockPathname = vi.fn(() => "/");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

import { AppShell } from "@/components/shell/AppShell";

describe("AppShell", () => {
  beforeEach(() => mockPathname.mockReturnValue("/"));

  // 스펙: children, 사이드바(브랜드), 토픽바(Explorer), 사용자 이름을 함께 렌더
  it("children 과 셸 골격을 렌더한다", () => {
    render(
      <AppShell email="areum@example.com" searchPlaceholder="Quick find...">
        <div>PAGE_CONTENT</div>
      </AppShell>,
    );
    expect(screen.getByText("PAGE_CONTENT")).toBeTruthy();
    expect(screen.getByText("Digital Sanctuary")).toBeTruthy();
    expect(screen.getByText("Explorer")).toBeTruthy();
    expect(screen.getByText("areum")).toBeTruthy();
  });

  // 스펙: 현재 경로의 네비가 활성
  it("usePathname 결과로 네비 활성 상태를 정한다", () => {
    mockPathname.mockReturnValue("/favorites");
    render(
      <AppShell email="a@b.com" searchPlaceholder="Search...">
        <div>x</div>
      </AppShell>,
    );
    expect(
      screen.getByRole("link", { name: /Favorites/ }).getAttribute("aria-current"),
    ).toBe("page");
  });
});
