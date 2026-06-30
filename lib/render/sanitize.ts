import sanitizeHtml from "sanitize-html";

/** 공개 경계용 HTML sanitize. BlockNote 출력 태그 허용, script/on* 제거. */
export function sanitizeContentHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      "img", "h1", "h2",
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      a: ["href", "name", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      "*": ["id"],
    },
    allowedSchemes: ["http", "https", "mailto", "data"],
  });
}
