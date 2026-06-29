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

  // 스펙(§1.1 요구사항 변경): 현재 경로의 네비가 활성 (네비는 Home·Recent 2개로 통일)
  it("usePathname 결과로 네비 활성 상태를 정한다", () => {
    mockPathname.mockReturnValue("/recent");
    render(
      <AppShell email="a@b.com" searchPlaceholder="Search...">
        <div>x</div>
      </AppShell>,
    );
    expect(
      screen.getByRole("link", { name: /Recent/ }).getAttribute("aria-current"),
    ).toBe("page");
  });

  // 스펙: 기본 variant 는 중앙 940 래퍼(max-w)를 쓴다 (홈·읽기 — 회색 배경 위 카드)
  it("기본 variant 는 max-940 중앙 래퍼를 쓴다", () => {
    const { container } = render(
      <AppShell email="a@b.com">
        <div>x</div>
      </AppShell>,
    );
    expect(container.querySelector('[class*="max-w-"]')).toBeTruthy();
  });

  // 스펙: variant="bare" 는 흰 배경(bg-surface) 전체폭, max-940 래퍼를 쓰지 않는다 (에디터 — 청사진 Frame 3)
  it('variant="bare" 는 흰 배경 콘텐츠 영역을 쓰고 max-940 래퍼를 쓰지 않는다', () => {
    const { container } = render(
      <AppShell email="a@b.com" variant="bare">
        <div>BARE_CONTENT</div>
      </AppShell>,
    );
    expect(screen.getByText("BARE_CONTENT")).toBeTruthy();
    expect(container.querySelector(".bg-surface")).toBeTruthy();
    expect(container.querySelector('[class*="max-w-"]')).toBeNull();
  });
});
