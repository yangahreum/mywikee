"use client";
import { useState } from "react";
import { PlusSquare, Folder, FileText } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { TreeNode, FolderRow } from "@/lib/tree/types";
import { canDropFolder } from "@/lib/tree/depth";
import { createFolder, moveItem } from "@/app/tree/actions";
import { TreeNodeRow } from "./TreeNodeRow";
import { useTreeRefresh } from "./useTreeRefresh";

/** 트리(중첩) → 평면 FolderRow[] (DnD 검증용). */
function flattenFolders(nodes: TreeNode[]): FolderRow[] {
  const out: FolderRow[] = [];
  const walk = (ns: TreeNode[]) => {
    for (const n of ns) {
      if (n.kind === "folder") {
        const { children, kind: _kind, ...rest } = n;
        void _kind;
        out.push(rest);
        walk(children);
      }
    }
  };
  walk(nodes);
  return out;
}

/** 루트 드롭존(전체 트리 영역) — 폴더/문서를 루트로 이동. */
function RootDropZone({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "__root__", data: { kind: "root" } });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-px rounded-md ${isOver ? "bg-chip/50" : ""}`}
    >
      {children}
    </div>
  );
}

export function KnowledgeTree({ nodes }: { nodes: TreeNode[] }) {
  const refresh = useTreeRefresh();
  const folders = flattenFolders(nodes);
  // 드래그 중 커서를 따라다닐 오버레이용 라벨(드래그 시작~끝).
  const [activeLabel, setActiveLabel] = useState<{ kind: "folder" | "doc"; label: string } | null>(null);

  // 클릭과 드래그 구분: 4px 이동해야 드래그 시작(폴더 토글/문서 링크 클릭 보존).
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const d = event.active.data.current as { kind?: "folder" | "doc"; label?: string } | undefined;
    if (d?.kind) setActiveLabel({ kind: d.kind, label: d.label ?? "" });
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveLabel(null); // 드롭 순간 오버레이 제거
    const { active, over } = event;
    if (!over) return;

    const kind = active.data.current?.kind as "folder" | "doc" | undefined;
    if (kind !== "folder" && kind !== "doc") return;

    const id = String(active.id);
    // over.id: "__root__" → 루트(null), "__doc_*" → 무시(문서엔 드롭 불가), 그 외 → 폴더 id
    const overId = String(over.id);
    if (overId.startsWith("__doc_")) return;
    const targetParentId = overId === "__root__" ? null : overId;

    if (id === targetParentId) return; // 자기 자신 위로 드롭

    // 폴더 이동은 4단·순환 검증(이미 Task 2에서 테스트된 canDropFolder).
    if (kind === "folder" && !canDropFolder(id, targetParentId, folders)) return;

    const res = await moveItem({ kind, id, targetParentId });
    if (res.ok) refresh();
  }

  async function handleCreateRootFolder() {
    const res = await createFolder(null);
    if (res.ok) refresh();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1.5 text-[10.5px] font-semibold tracking-[0.09em] text-ink-faint">
        KNOWLEDGE TREE
        <button
          type="button"
          aria-label="루트 폴더 추가"
          onClick={handleCreateRootFolder}
          className="cursor-pointer rounded p-0.5 hover:bg-chip hover:text-ink"
        >
          <PlusSquare size={14} strokeWidth={1.7} />
        </button>
      </div>
      {nodes.length === 0 ? (
        <p className="px-1.5 text-[12px] text-ink-faint">폴더가 없습니다. + 로 만들기.</p>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveLabel(null)}
        >
          <RootDropZone>
            {nodes.map((n) => (
              <TreeNodeRow key={n.id} node={n} depth={0} folders={folders} />
            ))}
          </RootDropZone>
          <DragOverlay>
            {activeLabel ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-[13px] text-ink shadow-card">
                {activeLabel.kind === "folder" ? (
                  <Folder size={15} strokeWidth={1.7} />
                ) : (
                  <FileText size={14} strokeWidth={1.7} />
                )}
                {activeLabel.label || "제목 없는 문서"}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
