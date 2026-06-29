"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Blocks } from "@/lib/documents/types";
import { saveDocument } from "./actions";

const BlockNoteEditor = dynamic(
  () => import("./blocknote").then((m) => m.BlockNoteEditor),
  { ssr: false },
);

const DEBOUNCE_MS = 1500;
type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  id: string;
  initialTitle: string;
  initialContent: Blocks;
};

export function Editor({ id, initialTitle, initialContent }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState<Blocks>(initialContent);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(
    async (t: string, c: Blocks) => {
      setStatus("saving");
      const res = await saveDocument(id, t, c);
      setStatus(res.ok ? "saved" : "error");
    },
    [id],
  );

  const requestSave = useCallback(
    (t: string, c: Blocks) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        void doSave(t, c);
      }, DEBOUNCE_MS);
    },
    [doSave],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onTitle = (next: string) => {
    setTitle(next);
    setStatus("idle");
    requestSave(next, content);
  };
  const onBlocks = useCallback(
    (next: Blocks) => {
      setContent(next);
      setStatus("idle");
      requestSave(title, next);
    },
    [title, requestSave],
  );

  async function onExport() {
    setExportMsg("생성 중…");
    const res = await fetch(`/api/documents/${id}/export`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setExportMsg(
      res.ok ? `생성됨: ${body.path}` : `실패: ${body.error ?? res.status}`,
    );
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 120px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ color: "#9098a0", fontSize: 13 }}>
          {status === "saving" ? "저장 중…" : status === "saved" ? "저장됨" : status === "error" ? "저장 실패" : ""}
        </span>
        <button
          type="button"
          onClick={onExport}
          style={{ padding: "6px 12px", border: "1px solid #c9ced4", borderRadius: 6, background: "#fff" }}
        >
          source 생성
        </button>
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        style={{ fontSize: 36, fontWeight: 800, border: "none", outline: "none", width: "100%", marginBottom: 24 }}
      />

      <BlockNoteEditor initialContent={initialContent} onChange={onBlocks} />

      {exportMsg && <p style={{ color: "#5a6066", marginTop: 16 }}>{exportMsg}</p>}
    </main>
  );
}
