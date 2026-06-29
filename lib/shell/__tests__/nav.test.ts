import { describe, it, expect } from "vitest";
import { NAV_ITEMS, isActiveNav } from "@/lib/shell/nav";

describe("nav", () => {
  // 스펙(§1.1 요구사항 변경): 네비는 Home·Recent 2개로 통일 (나머지는 KNOWLEDGE TREE 로 대체)
  it("정의된 네비 항목 순서와 href를 가진다", () => {
    expect(NAV_ITEMS.map((n) => n.href)).toEqual(["/", "/recent"]);
  });

  // 스펙: 정확히 일치하면 활성
  it("현재 경로와 정확히 일치하면 활성", () => {
    expect(isActiveNav("/recent", "/recent")).toBe(true);
  });

  // 스펙: 홈("/")은 정확히 "/"일 때만 활성 (다른 경로의 prefix 가 아님)
  it('홈("/")은 정확히 "/"일 때만 활성', () => {
    expect(isActiveNav("/", "/")).toBe(true);
    expect(isActiveNav("/", "/favorites")).toBe(false);
  });

  // 스펙: 홈이 아닌 항목은 하위 경로도 활성 (예: /folders/123)
  it("비-홈 항목은 하위 경로에서도 활성", () => {
    expect(isActiveNav("/folders", "/folders/abc")).toBe(true);
  });
});
