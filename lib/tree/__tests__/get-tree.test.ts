import { describe, it, expect } from "vitest";
import { mapFolderRow, mapDocRow } from "@/lib/tree/get-tree";

describe("get-tree 매핑", () => {
  it("folder row 매핑(snake→camel)", () => {
    expect(
      mapFolderRow({ id: "f", name: "F", parent_id: null, depth: 1, position: 2 }),
    ).toEqual({ id: "f", name: "F", parentId: null, depth: 1, position: 2 });
  });
  it("doc row 매핑(slug 전파, null title 방어)", () => {
    expect(mapDocRow({ id: "d", title: null, slug: "d-slug", folder_id: "f" })).toEqual({
      id: "d",
      title: "",
      slug: "d-slug",
      folderId: "f",
    });
  });
});
