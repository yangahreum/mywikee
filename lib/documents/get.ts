import { createClient } from "@/lib/supabase/server";
import { BlocksSchema, type DocumentRecord } from "./types";

/** 본인 소유 문서 1건 조회. 없거나 타인 문서면 null (RLS + 명시 owner 가드). */
export async function getDocument(
  id: string,
  ownerId: string,
): Promise<DocumentRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, owner_id, project, title, slug, content, created_at, updated_at")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .single();

  if (error || !data) return null;

  const content = BlocksSchema.safeParse(data.content);
  return {
    id: data.id,
    ownerId: data.owner_id,
    project: data.project,
    title: data.title,
    slug: data.slug,
    content: content.success ? content.data : [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
