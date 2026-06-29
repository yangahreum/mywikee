import { describe, it, expect } from "vitest";
import { isSafeSegment, buildExportPath } from "../export-path";

describe("isSafeSegment", () => {
  it("[a-z0-9-] 로만 이뤄진 세그먼트를 허용한다", () => {
    expect(isSafeSegment("my-doc-2")).toBe(true);
  });
  it("슬래시/점/대문자/빈값을 거부한다", () => {
    expect(isSafeSegment("a/b")).toBe(false);
    expect(isSafeSegment("..")).toBe(false);
    expect(isSafeSegment("Doc")).toBe(false);
    expect(isSafeSegment("")).toBe(false);
  });
});

describe("buildExportPath", () => {
  it("{root}/{project}/sources/{file}.html 경로를 만든다", () => {
    expect(buildExportPath("/w", "default", "my-doc")).toBe(
      "/w/default/sources/my-doc.html",
    );
  });
  it("안전하지 않은 project/file 은 throw 한다 (path traversal 방어)", () => {
    expect(() => buildExportPath("/w", "../etc", "x")).toThrow();
    expect(() => buildExportPath("/w", "default", "../../x")).toThrow();
  });
});
