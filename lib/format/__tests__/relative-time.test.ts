import { describe, it, expect } from "vitest";
import { relativeTime } from "@/lib/format/relative-time";

const NOW = new Date("2026-06-29T12:00:00Z");

describe("relativeTime", () => {
  // 스펙: 60초 미만은 "just now"
  it("방금 전은 just now", () => {
    expect(relativeTime("2026-06-29T11:59:30Z", NOW)).toBe("just now");
  });
  // 스펙: 분 단위 "Nm ago"
  it("분 단위", () => {
    expect(relativeTime("2026-06-29T11:45:00Z", NOW)).toBe("15m ago");
  });
  // 스펙: 시간 단위 "Nh ago"
  it("시간 단위", () => {
    expect(relativeTime("2026-06-29T10:00:00Z", NOW)).toBe("2h ago");
  });
  // 스펙: 일 단위 "Nd ago"
  it("일 단위", () => {
    expect(relativeTime("2026-06-27T12:00:00Z", NOW)).toBe("2d ago");
  });
  // 스펙: 미래 시각은 just now 로 방어(음수 표기 금지)
  it("미래는 just now", () => {
    expect(relativeTime("2026-06-29T12:05:00Z", NOW)).toBe("just now");
  });
});
