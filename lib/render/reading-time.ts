const CHARS_PER_MIN = 500; // 한글 읽기 속도 추정

/** 텍스트 → 읽기 시간(분, 올림, 최소 1). */
export function readingTime(text: string): number {
  const chars = text.trim().length;
  return Math.max(1, Math.ceil(chars / CHARS_PER_MIN));
}
