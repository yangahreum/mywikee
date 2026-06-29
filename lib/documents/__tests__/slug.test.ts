import { describe, it, expect } from "vitest";
import { slugify } from "../slug";

describe("slugify", () => {
  it("영문 제목을 소문자 하이픈 슬러그로 변환한다", () => {
    expect(slugify("My First Doc")).toBe("my-first-doc");
  });
  it("연속 공백/기호를 단일 하이픈으로 접고 양끝 하이픈을 제거한다", () => {
    expect(slugify("  Hello --- World!!  ")).toBe("hello-world");
  });
  it("ASCII 슬러그를 만들 수 없으면(예: 한글만) 빈 문자열을 반환한다", () => {
    expect(slugify("한글 제목")).toBe("");
  });
});
