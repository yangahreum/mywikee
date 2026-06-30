import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// IntersectionObserver mock (happy-dom)
vi.stubGlobal("IntersectionObserver", class {
  observe() {} disconnect() {} unobserve() {}
});

import { TocNav } from "@/components/reading/TocNav";

const items = [
  { id: "intro", text: "Introduction", level: 2 as const },
  { id: "core", text: "Core", level: 2 as const },
];

describe("TocNav", () => {
  // 스펙: "ON THIS PAGE" 라벨 + 각 항목을 #id 앵커 링크로 렌더
  it("ON THIS PAGE 라벨과 항목을 렌더한다", () => {
    render(<TocNav items={items} relatedTitles={["Gestalt"]} />);
    expect(screen.getByText("ON THIS PAGE")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Introduction" }).getAttribute("href")).toBe("#intro");
  });
  // 스펙: relatedTitles 가 있으면 RELATED PAGES 섹션을 렌더
  it("RELATED PAGES 를 렌더한다", () => {
    render(<TocNav items={items} relatedTitles={["Gestalt"]} />);
    expect(screen.getByText("RELATED PAGES")).toBeTruthy();
    expect(screen.getByText("Gestalt")).toBeTruthy();
  });
  // 스펙: 헤딩(items) 이 비면 TOC 라벨을 숨긴다
  it("헤딩 없으면 TOC 라벨을 숨긴다", () => {
    render(<TocNav items={[]} relatedTitles={[]} />);
    expect(screen.queryByText("ON THIS PAGE")).toBeNull();
  });
});
