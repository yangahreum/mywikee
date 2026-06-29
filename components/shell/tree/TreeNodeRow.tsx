"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Folder, FileText } from "lucide-react";
import type { TreeNode } from "@/lib/tree/types";

export function TreeNodeRow({ node, depth }: { node: TreeNode; depth: number }) {
  const [open, setOpen] = useState(true);
  const pad = 8 + depth * 14; // 들여쓰기

  if (node.kind === "doc") {
    return (
      <Link
        href={`/edit/${node.id}`}
        style={{ paddingLeft: pad + 21 }}
        className="flex h-[31px] items-center gap-2 rounded-md pr-3 text-[13px] text-ink-secondary hover:bg-chip"
      >
        <FileText size={14} strokeWidth={1.7} /> {node.title || "제목 없는 문서"}
      </Link>
    );
  }
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{ paddingLeft: pad }}
        className="flex h-8 w-full items-center gap-2 rounded-md pr-3 text-[13px] font-medium text-ink hover:bg-chip"
      >
        {open ? <ChevronDown size={15} strokeWidth={2} /> : <ChevronRight size={15} strokeWidth={2} />}
        <Folder size={15} strokeWidth={1.7} /> {node.name}
      </button>
      {open && node.children.map((c) => <TreeNodeRow key={c.id} node={c} depth={depth + 1} />)}
    </div>
  );
}
