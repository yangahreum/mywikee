import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "@/components/home/Footer";

describe("Footer", () => {
  // 스펙: 주입된 연도 + 카피라이트 + 링크 placeholder 렌더 (청사진 Frame 1 푸터)
  it("연도와 푸터 텍스트를 렌더한다", () => {
    render(<Footer year={2026} />);
    expect(screen.getByText(/2026 DIGITAL SANCTUARY/)).toBeTruthy();
    expect(screen.getByText("SCHOLARLY FOCUS MODE ACTIVE.")).toBeTruthy();
    expect(screen.getByText("PRIVACY")).toBeTruthy();
    expect(screen.getByText("TERMS")).toBeTruthy();
    expect(screen.getByText("API")).toBeTruthy();
  });
});
