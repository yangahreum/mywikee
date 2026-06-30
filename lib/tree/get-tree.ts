import { createClient } from "@/lib/supabase/server";
import { buildTree } from "./build-tree";
import type { FolderRow, DocRow, TreeNode } from "./types";

export function mapFolderRow(r: {
  id: string;
  name: string | null;
  parent_id: string | null;
  depth: number;
  position: number;
}): FolderRow {
  return { id: r.id, name: r.name ?? "", parentId: r.parent_id, depth: r.depth, position: r.position };
}

export function mapDocRow(r: { id: string; title: string | null; slug: string; folder_id: string | null }): DocRow {
  return { id: r.id, title: r.title ?? "", slug: r.slug, folderId: r.folder_id };
}

/** owner 의 폴더 트리(폴더 + 문서). 조회 실패 시 빈 배열. */
export async function getTree(ownerId: string): Promise<TreeNode[]> {
  const supabase = await createClient();
  const [{ data: f }, { data: d }] = await Promise.all([
    supabase.from("folders").select("id, name, parent_id, depth, position").eq("owner_id", ownerId),
    supabase.from("documents").select("id, title, slug, folder_id").eq("owner_id", ownerId),
  ]);
  const folders: FolderRow[] = (f ?? []).map(mapFolderRow);
  const docs: DocRow[] = (d ?? []).map(mapDocRow);
  return buildTree(folders, docs);
}
