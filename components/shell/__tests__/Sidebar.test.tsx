import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "@/components/shell/Sidebar";

describe("Sidebar", () => {
  // 스펙: 브랜드 + 6개 네비 항목 렌더
  it("브랜드와 모든 네비 항목을 렌더한다", () => {
    render(<Sidebar pathname="/" userSlot={<div>user</div>} />);
    expect(screen.getByText("Digital Sanctuary")).toBeTruthy();
    for (const label of [
      "Home",
      "Recent",
      "Knowledge Base",
      "Favorites",
      "Folders",
      "Archive",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  // 스펙: 활성 항목은 aria-current="page"
  it('활성 항목에 aria-current="page" 를 준다', () => {
    render(<Sidebar pathname="/favorites" userSlot={null} />);
    const active = screen.getByRole("link", { name: /Favorites/ });
    expect(active.getAttribute("aria-current")).toBe("page");
    const inactive = screen.getByRole("link", { name: /Home/ });
    expect(inactive.getAttribute("aria-current")).toBeNull();
  });

  // 스펙: userSlot 을 하단에 렌더 (UserMenu 주입 지점)
  it("userSlot 을 렌더한다", () => {
    render(<Sidebar pathname="/" userSlot={<div>USER_SLOT</div>} />);
    expect(screen.getByText("USER_SLOT")).toBeTruthy();
  });
});
