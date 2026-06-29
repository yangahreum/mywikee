import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader } from "@/components/home/PageHeader";

describe("PageHeader", () => {
  // 스펙: 제목 "Home" + "{N} pages" 메타 렌더
  it("제목과 페이지 수 메타를 렌더한다", () => {
    render(<PageHeader totalCount={631} />);
    expect(screen.getByRole("heading", { name: "Home" })).toBeTruthy();
    expect(screen.getByText(/631 pages/)).toBeTruthy();
  });
  // 스펙: New Page 버튼이 문서 생성 액션 폼으로 제출(server action 주입)
  it("New Page 버튼을 렌더한다", () => {
    render(<PageHeader totalCount={0} />);
    expect(screen.getByRole("button", { name: /New Page/ })).toBeTruthy();
  });
});
