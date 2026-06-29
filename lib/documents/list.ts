import { createClient } from "@/lib/supabase/server";

export type DocumentListItem = {
  id: string;
  title: string;
  project: string;
  createdAt: string;
};

/** 내 문서 목록(최신순). */
export async function listMyDocuments(
  ownerId: string,
): Promise<DocumentListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, project, created_at")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((d) => ({
    id: d.id,
    title: d.title,
    project: d.project,
    createdAt: d.created_at,
  }));
}
