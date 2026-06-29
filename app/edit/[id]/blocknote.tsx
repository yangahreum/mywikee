"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { Blocks } from "@/lib/documents/types";

type Props = {
  initialContent: Blocks;
  onChange: (blocks: Blocks) => void;
};

/**
 * 기본 BlockNote 에디터(커스텀 블록/직렬화기 없음).
 * - initialContent 가 비어있으면 BlockNote 가 throw 하므로 undefined 로 전달.
 * - onChange 는 editor.document(Block[]) 를 그대로 상위로 올린다.
 */
export function BlockNoteEditor({ initialContent, onChange }: Props) {
  const editor = useCreateBlockNote({
    initialContent:
      initialContent.length > 0
        ? // BlockNote PartialBlock[] 호환. 저장된 Block[] 를 그대로 사용.
          (initialContent as never)
        : undefined,
  });

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      onChange={() => onChange(editor.document as unknown as Blocks)}
    />
  );
}
