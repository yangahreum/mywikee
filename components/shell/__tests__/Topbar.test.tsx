import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Topbar } from "@/components/shell/Topbar";

describe("Topbar", () => {
  // 스펙: Quick find placeholder + Explorer 활성 텍스트
  it("Quick find 와 Explorer/Graphs/Templates 를 렌더한다", () => {
    render(<Topbar searchPlaceholder="Quick find..." />);
    expect(screen.getByText("Quick find...")).toBeTruthy();
    expect(screen.getByText("Explorer")).toBeTruthy();
    expect(screen.getByText("Graphs")).toBeTruthy();
    expect(screen.getByText("Templates")).toBeTruthy();
  });

  // 스펙: 백로그 기능(Graphs/Templates)은 비활성 — aria-disabled
  it("Graphs/Templates 는 aria-disabled 로 비활성 표시한다", () => {
    render(<Topbar searchPlaceholder="Search..." />);
    expect(screen.getByText("Graphs").getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("Templates").getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByText("Explorer").getAttribute("aria-disabled")).toBeNull();
  });

  // 스펙: Publish 버튼은 S1 에선 자리만 — disabled
  it("Publish 버튼은 S1 에서 비활성(disabled)", () => {
    render(<Topbar searchPlaceholder="Search..." />);
    const publish = screen.getByRole("button", { name: /Publish/ });
    expect(publish.hasAttribute("disabled")).toBe(true);
  });
});
