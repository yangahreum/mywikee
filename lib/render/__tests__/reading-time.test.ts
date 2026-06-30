import { describe, it, expect } from "vitest";
import { readingTime } from "@/lib/render/reading-time";

describe("readingTime", () => {
  it("빈 텍스트는 1분(최소)", () => {
    expect(readingTime("")).toBe(1);
  });
  // 스펙: 분당 약 500자 기준, 올림, 최소 1
  it("긴 텍스트는 분 단위 올림", () => {
    expect(readingTime("가".repeat(500))).toBe(1);
    expect(readingTime("가".repeat(501))).toBe(2);
    expect(readingTime("가".repeat(1500))).toBe(3);
  });
});
