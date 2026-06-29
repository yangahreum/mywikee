import { ServerBlockNoteEditor } from "@blocknote/server-util";
import type { Blocks } from "@/lib/documents/types";

/**
 * BlockNote Block[] → 완전한 HTML 문자열. 기본 스키마(커스텀 블록 없음)이므로
 * ServerBlockNoteEditor 기본 인스턴스로 변환. 서버 사이드 전용.
 */
export async function blocksToHtml(blocks: Blocks): Promise<string> {
  const editor = ServerBlockNoteEditor.create();
  return await editor.blocksToFullHTML(blocks as never);
}
