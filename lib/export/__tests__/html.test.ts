import { describe, it, expect } from "vitest";
import { blocksToHtml } from "../html";

describe("blocksToHtml", () => {
  it("문단 블록의 텍스트를 포함하는 HTML 문자열을 만든다", async () => {
    const blocks = [
      {
        type: "paragraph",
        content: [{ type: "text", text: "안녕 위키", styles: {} }],
      },
    ];
    const html = await blocksToHtml(blocks as never);
    expect(typeof html).toBe("string");
    expect(html).toContain("안녕 위키");
  });
});
