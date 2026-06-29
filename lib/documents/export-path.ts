/** 파일 경로 세그먼트 안전성: [a-z0-9-] 만 허용(슬래시/점/.. 차단). */
export function isSafeSegment(segment: string): boolean {
  return /^[a-z0-9-]+$/.test(segment);
}

/**
 * source 파일 절대 경로 조합: {wikiRoot}/{project}/sources/{file}.html
 * project/file 이 안전하지 않으면 throw (path traversal 방어).
 */
export function buildExportPath(
  wikiRoot: string,
  project: string,
  file: string,
): string {
  if (!isSafeSegment(project)) {
    throw new Error(`unsafe project segment: ${project}`);
  }
  if (!isSafeSegment(file)) {
    throw new Error(`unsafe file segment: ${file}`);
  }
  const root = wikiRoot.replace(/\/+$/, "");
  return `${root}/${project}/sources/${file}.html`;
}
