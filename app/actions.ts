"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 빈 draft 문서 생성 후 에디터로 이동.
 * - owner_id 는 서버에서 결정(auth.uid()). slug 는 draft-{8hex} 자동 생성.
 * - UNIQUE(slug) 충돌(23505) 시 1회 재시도.
 */
export async function createDraftDocument(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let createdId: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const slug = `draft-${crypto.randomUUID().slice(0, 8)}`;
    const { data, error } = await supabase
      .from("documents")
      .insert({ slug, title: "", owner_id: user.id })
      .select("id")
      .single();

    if (!error && data) {
      createdId = data.id;
      break;
    }
    if (error?.code !== "23505") {
      console.error("[createDraftDocument] insert error:", error);
      throw new Error("새 문서 만들기에 실패했어요.");
    }
  }
  if (!createdId) throw new Error("슬러그 생성 실패. 다시 시도해주세요.");

  redirect(`/edit/${createdId}`);
}
