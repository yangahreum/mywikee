"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BlocksSchema, type Blocks } from "@/lib/documents/types";

export type SaveResult =
  | { ok: true }
  | { ok: false; error: "unauthorized" | "validation" | "not_found" | "db_error" };

const SaveInput = z.object({
  id: z.string().uuid(),
  title: z.string().max(200),
  content: BlocksSchema,
});

export async function saveDocument(
  id: string,
  title: string,
  content: Blocks,
): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = SaveInput.safeParse({ id, title, content });
  if (!parsed.success) return { ok: false, error: "validation" };

  const { data, error } = await supabase
    .from("documents")
    .update({ title: parsed.data.title, content: parsed.data.content })
    .eq("id", parsed.data.id)
    .eq("owner_id", user.id)
    .select("id")
    .single();

  if (error) {
    if (error.code === "PGRST116") return { ok: false, error: "not_found" };
    console.error("[saveDocument] db error:", error);
    return { ok: false, error: "db_error" };
  }
  if (!data) return { ok: false, error: "not_found" };

  revalidatePath("/me");
  return { ok: true };
}
