import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Article } from "@/components/reading/Article";

describe("Article", () => {
  const base = {
    title: "The Architecture of Silence",
    breadcrumb: ["Knowledge Base", "Research"],
    html: '<h2 id="intro">Introduction</h2><p>body text</p>',
    author: "areum",
    updatedLabel: "2 days ago",
    readingMin: 8,
    editHref: "/edit/d1",
  };
  // 스펙: h1 제목 + 브레드크럼 + sanitized 본문(헤딩/문단) 렌더
  it("제목·브레드크럼·본문을 렌더한다", () => {
    render(<Article {...base} />);
    expect(screen.getByRole("heading", { level: 1, name: /Architecture of Silence/ })).toBeTruthy();
    expect(screen.getByText("Introduction")).toBeTruthy();
    expect(screen.getByText("body text")).toBeTruthy();
  });
  // 스펙: editHref 가 있으면 Edit 링크를 해당 href 로 렌더
  it("Edit 버튼(editHref)을 렌더한다", () => {
    render(<Article {...base} />);
    const link = screen.getByRole("link", { name: /Edit/ });
    expect(link.getAttribute("href")).toBe("/edit/d1");
  });
  // 스펙: 저자명 + "N min" 읽기시간 메타를 렌더
  it("저자·읽기시간 메타를 렌더한다", () => {
    render(<Article {...base} />);
    expect(screen.getByText("areum")).toBeTruthy();
    expect(screen.getByText(/8 min/)).toBeTruthy();
  });
});
