import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { createClient } from "@/lib/supabase/server";
import { getDocument } from "@/lib/documents/get";
import { slugify } from "@/lib/documents/slug";
import { buildExportPath, isSafeSegment } from "@/lib/documents/export-path";
import { blocksToHtml } from "@/lib/export/html";

/**
 * source 생성: 문서 → HTML → {WIKI_ROOT}/{project}/sources/{file}.html 기록.
 * - WIKI_ROOT 미설정 시 비활성(503). 글은 DB 에 보존.
 * - 파일명 = slugify(title) || 문서 slug. project/file 은 traversal 가드.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const wikiRoot = process.env.WIKI_ROOT;
  if (!wikiRoot) {
    return NextResponse.json(
      { error: "export_disabled: WIKI_ROOT not set" },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const doc = await getDocument(id, user.id);
  if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const file = slugify(doc.title) || doc.slug;
  if (!isSafeSegment(doc.project) || !isSafeSegment(file)) {
    return NextResponse.json({ error: "unsafe_path" }, { status: 400 });
  }

  let targetPath: string;
  try {
    targetPath = buildExportPath(wikiRoot, doc.project, file);
  } catch {
    return NextResponse.json({ error: "unsafe_path" }, { status: 400 });
  }

  try {
    const html = await blocksToHtml(doc.content);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, html, "utf-8");
  } catch (e) {
    console.error("[export] write failed:", e);
    return NextResponse.json({ error: "write_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path: targetPath });
}
