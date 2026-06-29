import type { FolderRow, DocRow, TreeNode, TreeFolder } from "./types";

/**
 * 평면 folders + docs → 계층 TreeNode[].
 * 각 레벨: 폴더(position asc) 먼저, 그 뒤 문서(원래 순서). 루트는 parentId/folderId === null.
 */
export function buildTree(folders: FolderRow[], docs: DocRow[]): TreeNode[] {
  const byParent = (parentId: string | null): TreeNode[] => {
    const folderNodes: TreeFolder[] = folders
      .filter((f) => f.parentId === parentId)
      .sort((a, b) => a.position - b.position)
      .map((f) => ({ ...f, kind: "folder", children: byParent(f.id) }));
    const docNodes: TreeNode[] = docs
      .filter((d) => d.folderId === parentId)
      .map((d) => ({ ...d, kind: "doc" }));
    return [...folderNodes, ...docNodes];
  };
  return byParent(null);
}
