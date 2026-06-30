export type TocItem = { id: string; text: string; level: 2 | 3 };

/** 헤딩 텍스트 → URL-safe id (영문 소문자화, 공백→-, 한글 보존). */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

/** html 에서 h2/h3 추출 + id 주입. 중복 id 는 -N suffix. */
export function extractToc(html: string): { items: TocItem[]; html: string } {
  const items: TocItem[] = [];
  const seen = new Map<string, number>();
  const out = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_m, lvl: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").trim();
    let id = slugifyHeading(text);
    const n = (seen.get(id) ?? 0) + 1;
    seen.set(id, n);
    if (n > 1) id = `${id}-${n}`;
    items.push({ id, text, level: Number(lvl) as 2 | 3 });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });
  return { items, html: out };
}
