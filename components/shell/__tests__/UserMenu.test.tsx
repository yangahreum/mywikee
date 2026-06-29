import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserMenu } from "@/components/shell/UserMenu";

describe("UserMenu", () => {
  // 스펙: 사용자 식별 텍스트(email 앞부분) 표시
  it("이메일에서 표시 이름을 보여준다", () => {
    render(<UserMenu email="areum@example.com" />);
    expect(screen.getByText("areum")).toBeTruthy();
  });

  // 스펙: 로그아웃은 POST /auth/sign-out 폼으로 제출
  it("로그아웃 폼이 POST /auth/sign-out 으로 제출된다", () => {
    render(<UserMenu email="areum@example.com" />);
    const button = screen.getByRole("button", { name: /로그아웃|Sign out/i });
    const form = button.closest("form");
    expect(form?.getAttribute("action")).toBe("/auth/sign-out");
    expect(form?.getAttribute("method")).toBe("post");
  });
});
