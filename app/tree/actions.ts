"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canCreateChildFolder, canDropFolder } from "@/lib/tree/depth";
import type { FolderRow } from "@/lib/tree/types";

async function loadFolders(supabase: Awaited<ReturnType<typeof createClient>>, ownerId: string): Promise<FolderRow[]> {
  const { data } = await supabase
    .from("folders").select("id, name, parent_id, depth, position").eq("owner_id", ownerId);
  return (data ?? []).map((r) => ({ id: r.id, name: r.name, parentId: r.parent_id, depth: r.depth, position: r.position }));
}

const CreateInput = z.object({ parentId: z.string().uuid().nullable(), name: z.string().max(100).optional() });

export async function createFolder(parentId: string | null, name?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthorized" };
  const parsed = CreateInput.safeParse({ parentId, name });
  if (!parsed.success) return { ok: false as const, error: "validation" };

  const folders = await loadFolders(supabase, user.id);
  if (!canCreateChildFolder(parentId, folders)) return { ok: false as const, error: "depth_exceeded" };
  const depth = parentId ? (folders.find((f) => f.id === parentId)!.depth + 1) : 1;

  const { error } = await supabase.from("folders").insert({
    owner_id: user.id, parent_id: parentId, name: name ?? "새 폴더", depth,
  });
  if (error) return { ok: false as const, error: "db_error" };
  revalidatePath("/");
  return { ok: true as const };
}

const MoveInput = z.object({
  kind: z.enum(["folder", "doc"]),
  id: z.string().uuid(),
  targetParentId: z.string().uuid().nullable(),
});

export async function moveItem(input: z.infer<typeof MoveInput>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "unauthorized" };
  const parsed = MoveInput.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "validation" };
  const { kind, id, targetParentId } = parsed.data;

  if (kind === "doc") {
    const { error } = await supabase.from("documents")
      .update({ folder_id: targetParentId }).eq("id", id).eq("owner_id", user.id);
    if (error) return { ok: false as const, error: "db_error" };
  } else {
    const folders = await loadFolders(supabase, user.id);
    if (!canDropFolder(id, targetParentId, folders)) return { ok: false as const, error: "depth_exceeded_or_cycle" };
    const newDepth = targetParentId ? (folders.find((f) => f.id === targetParentId)!.depth + 1) : 1;
    // 서브트리 depth 일괄 재계산
    const delta = newDepth - folders.find((f) => f.id === id)!.depth;
    const ids = collectSubtree(id, folders);
    await supabase.from("folders").update({ parent_id: targetParentId, depth: newDepth }).eq("id", id).eq("owner_id", user.id);
    for (const sub of ids.filter((x) => x !== id)) {
      const cur = folders.find((f) => f.id === sub)!;
      await supabase.from("folders").update({ depth: cur.depth + delta }).eq("id", sub).eq("owner_id", user.id);
    }
  }
  revalidatePath("/");
  return { ok: true as const };
}

function collectSubtree(rootId: string, folders: FolderRow[]): string[] {
  const out = [rootId];
  for (const f of folders.filter((x) => x.parentId === rootId)) out.push(...collectSubtree(f.id, folders));
  return out;
}
