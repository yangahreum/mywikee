export type FolderRow = {
  id: string;
  name: string;
  parentId: string | null;
  depth: number;
  position: number;
};

export type DocRow = {
  id: string;
  title: string;
  slug: string;
  folderId: string | null;
};

export type TreeFolder = FolderRow & {
  kind: "folder";
  children: TreeNode[];
};
export type TreeDoc = DocRow & { kind: "doc" };
export type TreeNode = TreeFolder | TreeDoc;
