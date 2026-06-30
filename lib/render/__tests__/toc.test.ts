import { describe, it, expect } from "vitest";
import { extractToc, slugifyHeading } from "@/lib/render/toc";

describe("slugifyHeading", () => {
  it("텍스트를 id 로 slugify", () => {
    expect(slugifyHeading("Hello World")).toBe("hello-world");
    expect(slugifyHeading("코어 원칙")).toBe("코어-원칙");
  });
});

describe("extractToc", () => {
  // 스펙: h2/h3 추출(level/text/id), 중복 id 는 -2 suffix
  it("h2/h3 를 추출하고 id 를 부여한다", () => {
    const { items } = extractToc("<h2>Intro</h2><p>x</p><h3>Sub</h3><h2>Intro</h2>");
    expect(items).toEqual([
      { id: "intro", text: "Intro", level: 2 },
      { id: "sub", text: "Sub", level: 3 },
      { id: "intro-2", text: "Intro", level: 2 },
    ]);
  });
  // 스펙: 헤딩에 id 주입된 html 반환
  it("html 에 헤딩 id 를 주입한다", () => {
    const { html } = extractToc("<h2>Intro</h2>");
    expect(html).toContain('id="intro"');
  });
  // 스펙: 헤딩 없으면 빈 목차
  it("헤딩 없으면 빈 목차", () => {
    expect(extractToc("<p>no heading</p>").items).toEqual([]);
  });
});
