import { PlusSquare } from "lucide-react";
import type { TreeNode } from "@/lib/tree/types";
import { TreeNodeRow } from "./TreeNodeRow";

export function KnowledgeTree({ nodes }: { nodes: TreeNode[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-1.5 text-[10.5px] font-semibold tracking-[0.09em] text-ink-faint">
        KNOWLEDGE TREE
        <PlusSquare size={14} strokeWidth={1.7} className="cursor-pointer" />
      </div>
      {nodes.length === 0 ? (
        <p className="px-1.5 text-[12px] text-ink-faint">폴더가 없습니다. + 로 만들기.</p>
      ) : (
        <div className="flex flex-col gap-px">
          {nodes.map((n) => <TreeNodeRow key={n.id} node={n} depth={0} />)}
        </div>
      )}
    </div>
  );
}
