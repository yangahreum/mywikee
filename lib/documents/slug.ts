/**
 * 제목을 파일명용 ASCII 슬러그로 변환.
 * - 소문자화, [a-z0-9] 외 문자는 하이픈으로, 연속 하이픈 접기, 양끝 하이픈 제거.
 * - ASCII 결과가 비면 ""(호출부에서 문서 slug 로 폴백). 한글 슬러그는 후속 슬라이스.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
