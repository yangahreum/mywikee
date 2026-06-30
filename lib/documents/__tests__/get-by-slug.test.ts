import { describe, it, expect } from "vitest";
import { mapBySlugRow } from "@/lib/documents/get-by-slug";

describe("mapBySlugRow", () => {
  it("row 매핑(null 방어)", () => {
    expect(
      mapBySlugRow({ id: "d", owner_id: "o", title: null, slug: "s", project: null, content: [{}], updated_at: "t" }),
    ).toMatchObject({ id: "d", title: "", slug: "s", project: "" });
  });
});
