"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Folder, FileText, Plus, Trash2 } from "lucide-react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import type { TreeNode } from "@/lib/tree/types";
import { createFolder, deleteFolder, deleteDocument } from "@/app/tree/actions";
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

  // 드래그 핸들: doc/folder 공통. id=node id, data로 kind + 라벨 전달(DragOverlay 표시용).
  const draggable = useDraggable({
    id: node.id,
    data: { kind: node.kind, label: node.kind === "doc" ? node.title : node.name },
  });
  // 폴더는 droppable. id=folder id.
  const droppable = useDroppable({
    id: node.kind === "folder" ? node.id : `__doc_${node.id}`,
    disabled: node.kind !== "folder",
    data: { kind: node.kind },
  });

  async function removeDocument(e: React.MouseEvent) {
    // 삭제 버튼은 Link 내부 영역과 시각적으로 겹치므로, 네비게이션이 트리거되지 않도록 차단.
    e.preventDefault();
    e.stopPropagation();
    if (node.kind !== "doc") return;
    if (!window.confirm(`'${node.title || "제목 없는 문서"}' 문서를 삭제할까요?`)) return;
    const res = await deleteDocument(node.id);
    if (res.ok) refresh();
  }

  if (node.kind === "doc") {
    // 문서 행: draggable/Link 는 종전대로 유지하고, group 래퍼로 hover 시 삭제 버튼 노출.
    // 삭제 버튼은 draggable(listeners) 바깥에 두어 드래그/삭제가 섞이지 않게 한다.
    return (
      <div className="group flex items-center rounded-md hover:bg-chip">
        <Link
          ref={draggable.setNodeRef}
          {...draggable.attributes}
          {...draggable.listeners}
          href={`/edit/${node.id}`}
          style={{ paddingLeft: pad + 21 }}
          className={`flex h-[31px] flex-1 items-center gap-2 rounded-md pr-1 text-[13px] text-ink-secondary ${draggable.isDragging ? "opacity-40" : ""}`}
        >
          <FileText size={14} strokeWidth={1.7} /> {node.title || "제목 없는 문서"}
        </Link>
        <button
          type="button"
          aria-label={`${node.title || "제목 없는 문서"} 문서 삭제`}
          onClick={removeDocument}
          className="mr-1.5 hidden h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-chip hover:text-red-500 group-hover:flex"
        >
          <Trash2 size={13} strokeWidth={2} />
        </button>
      </div>
    );
  }

  const canAddChild = canCreateChildFolder(node.id, folders ?? []);

  async function addChildFolder() {
    const res = await createFolder(node.id);
    if (res.ok) refresh();
  }

  async function removeFolder() {
    if (node.kind !== "folder") return;
    if (!window.confirm(`'${node.name}' 폴더를 삭제할까요? 하위 폴더는 함께 삭제되고, 안의 문서는 루트로 이동합니다.`)) return;
    const res = await deleteFolder(node.id);
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
          className={`flex h-8 flex-1 items-center gap-2 rounded-md pr-1 text-[13px] font-medium hover:bg-chip ${open ? "text-ink" : "text-ink-secondary"} ${draggable.isDragging ? "opacity-40" : ""}`}
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
        <button
          type="button"
          aria-label={`${node.name} 폴더 삭제`}
          onClick={removeFolder}
          className="mr-1.5 hidden h-6 w-6 items-center justify-center rounded text-ink-faint hover:bg-chip hover:text-red-500 group-hover:flex"
        >
          <Trash2 size={13} strokeWidth={2} />
        </button>
      </div>
      {open && node.children.map((c) => <TreeNodeRow key={c.id} node={c} depth={depth + 1} folders={folders} />)}
    </div>
  );
}
