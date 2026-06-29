import type { FolderRow } from "./types";

const MAX_DEPTH = 4;

/** 노드 포함 서브트리 높이(잎 = 1). */
export function subtreeHeight(id: string, folders: FolderRow[]): number {
  const children = folders.filter((f) => f.parentId === id);
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map((c) => subtreeHeight(c.id, folders)));
}

/** candidate 가 ancestor 의 자손인가(자기 자신 포함). */
export function isDescendant(
  candidate: string,
  ancestor: string,
  folders: FolderRow[],
): boolean {
  let cur: string | null = candidate;
  while (cur) {
    if (cur === ancestor) return true;
    cur = folders.find((f) => f.id === cur)?.parentId ?? null;
  }
  return false;
}

function depthOf(id: string | null, folders: FolderRow[]): number {
  if (id === null) return 0; // 루트 위 가상 노드
  return folders.find((f) => f.id === id)?.depth ?? 0;
}

/** parentId 밑에 새 폴더 생성 가능한가(생성 후 depth ≤ 4). */
export function canCreateChildFolder(
  parentId: string | null,
  folders: FolderRow[],
): boolean {
  return depthOf(parentId, folders) + 1 <= MAX_DEPTH;
}

/** folderId 를 targetParentId 밑으로 옮길 수 있는가(4단 + 순환). */
export function canDropFolder(
  folderId: string,
  targetParentId: string | null,
  folders: FolderRow[],
): boolean {
  // 순환: 대상이 자기 자신 또는 자손이면 불가
  if (targetParentId !== null && isDescendant(targetParentId, folderId, folders)) {
    return false;
  }
  return depthOf(targetParentId, folders) + subtreeHeight(folderId, folders) <= MAX_DEPTH;
}
