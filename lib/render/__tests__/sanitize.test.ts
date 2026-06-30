import { describe, it, expect } from "vitest";
import { sanitizeContentHtml } from "@/lib/render/sanitize";

describe("sanitizeContentHtml", () => {
  // 스펙: script 태그 제거
  it("script 를 제거한다", () => {
    expect(sanitizeContentHtml('<p>hi</p><script>alert(1)</script>')).not.toContain("script");
  });
  // 스펙: on* 핸들러 속성 제거
  it("onerror 등 이벤트 핸들러를 제거한다", () => {
    expect(sanitizeContentHtml('<img src="x" onerror="alert(1)">')).not.toContain("onerror");
  });
  // 스펙: 허용 태그(제목/문단/목록/코드/강조/링크/이미지) 보존
  it("허용 태그를 보존한다", () => {
    const html = '<h2>T</h2><p><strong>b</strong></p><ul><li>x</li></ul><pre><code>c</code></pre><a href="/x">l</a>';
    const out = sanitizeContentHtml(html);
    for (const t of ["<h2>", "<strong>", "<ul>", "<li>", "<pre>", "<code>", "<a"]) {
      expect(out).toContain(t);
    }
  });
});
