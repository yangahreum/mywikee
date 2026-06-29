"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Folder, FileText, Plus } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { TreeNode } from "@/lib/tree/types";
import { createFolder } from "@/app/tree/actions";
import { canCreateChildFolder } from "@/lib/tree/depth";
import type { FolderRow } from "@/lib/tree/types";
import { useTreeRefresh } from "./useTreeRefresh";

export function TreeNodeRow({
  node,
  depth,
  folders,
}: {
  node: TreeNode;
  depth: number;
  // 평면 폴더 목록(4단 생성 가능 여부 판정용). DnD 미사용 환경에선 빈 배열 허용.
  folders?: FolderRow[];
}) {
  const [open, setOpen] = useState(true);
  const refresh = useTreeRefresh();
  const pad = 8 + depth * 14; // 들여쓰기

  // 드래그 핸들: doc/folder 공통. id=node id, data로 kind 전달.
  const draggable = useDraggable({ id: node.id, data: { kind: node.kind } });
  // 폴더는 droppable. id=folder id.
  const droppable = useDroppable({
    id: node.kind === "folder" ? node.id : `__doc_${node.id}`,
    disabled: node.kind !== "folder",
    data: { kind: node.kind },
  });

  if (node.kind === "doc") {
    return (
      <Link
        ref={draggable.setNodeRef}
        {...draggable.attributes}
        {...draggable.listeners}
        href={`/edit/${node.id}`}
        style={{ paddingLeft: pad + 21 }}
        className="flex h-[31px] items-center gap-2 rounded-md pr-3 text-[13px] text-ink-secondary hover:bg-chip"
      >
        <FileText size={14} strokeWidth={1.7} /> {node.title || "제목 없는 문서"}
      </Link>
    );
  }

  const canAddChild = canCreateChildFolder(node.id, folders ?? []);

  async function addChildFolder() {
    const res = await createFolder(node.id);
    if (res.ok) refresh();
  }

  return (
    <div>
      <div
        ref={droppable.setNodeRef}
        className={`group flex items-center rounded-md ${droppable.isOver ? "bg-chip ring-1 ring-accent/40" : ""}`}
      >
        <button
          type="button"
          ref={draggable.setNodeRef}
          {...draggable.attributes}
          {...draggable.listeners}
          onClick={() => setOpen((v) => !v)}
          style={{ paddingLeft: pad }}
          className="flex h-8 flex-1 items-center gap-2 rounded-md pr-1 text-[13px] font-medium text-ink hover:bg-chip"
        >
          {open ? <ChevronDown size={15} strokeWidth={2} /> : <ChevronRight size={15} strokeWidth={2} />}
          <Folder size={15} strokeWidth={1.7} /> {node.name}
        </button>
        {canAddChild && (
          <button
            type="button"
            aria-label={`${node.name} 하위 폴더 추가`}
            onClick={addChildFolder}
            className="mr-1.5 hidden h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-chip hover:text-ink group-hover:flex"
          >
            <Plus size={13} strokeWidth={2} />
          </button>
        )}
      </div>
      {open && node.children.map((c) => <TreeNodeRow key={c.id} node={c} depth={depth + 1} folders={folders} />)}
    </div>
  );
}
