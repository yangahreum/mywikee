import { describe, it, expect } from "vitest";
import { mapDashboardRow } from "@/lib/home/get-dashboard";

describe("mapDashboardRow", () => {
  // 스펙: DB row → DashboardDoc (snake → camel, slug 전파, null title/project 방어)
  it("row 를 DashboardDoc 으로 매핑한다", () => {
    expect(
      mapDashboardRow({
        id: "d1",
        title: "문서",
        slug: "munseo",
        project: "Research",
        updated_at: "2026-06-29T10:00:00Z",
      }),
    ).toEqual({
      id: "d1",
      title: "문서",
      slug: "munseo",
      project: "Research",
      updatedAt: "2026-06-29T10:00:00Z",
    });
  });
  // 스펙: title/project 가 null 이면 빈 문자열로 (slug 은 그대로 전파)
  it("null title/project 는 빈 문자열", () => {
    const r = mapDashboardRow({
      id: "d2",
      title: null,
      slug: "d2-slug",
      project: null,
      updated_at: "2026-06-29T10:00:00Z",
    });
    expect(r.title).toBe("");
    expect(r.project).toBe("");
    expect(r.slug).toBe("d2-slug");
  });
});
