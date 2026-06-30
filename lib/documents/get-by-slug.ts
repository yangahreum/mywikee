import { createClient } from "@/lib/supabase/server";
import { BlocksSchema, type Blocks } from "@/lib/documents/types";

export type ReadDoc = {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  project: string;
  content: Blocks;
  updatedAt: string;
};

export function mapBySlugRow(r: {
  id: string; owner_id: string; title: string | null; slug: string;
  project: string | null; content: unknown; updated_at: string;
}): ReadDoc {
  const content = BlocksSchema.safeParse(r.content);
  return {
    id: r.id, ownerId: r.owner_id, title: r.title ?? "", slug: r.slug,
    project: r.project ?? "", content: content.success ? content.data : [], updatedAt: r.updated_at,
  };
}

/** slug + owner 로 읽기용 문서 1건. 없으면 null. */
export async function getDocumentBySlug(slug: string, ownerId: string): Promise<ReadDoc | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, owner_id, title, slug, project, content, updated_at")
    .eq("slug", slug)
    .eq("owner_id", ownerId)
    .single();
  if (error || !data) return null;
  return mapBySlugRow(data);
}
