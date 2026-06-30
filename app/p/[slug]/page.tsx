import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDocumentBySlug } from "@/lib/documents/get-by-slug";
import { getTree } from "@/lib/tree/get-tree";
import { blocksToHtml } from "@/lib/export/html";
import { sanitizeContentHtml } from "@/lib/render/sanitize";
import { extractToc } from "@/lib/render/toc";
import { readingTime } from "@/lib/render/reading-time";
import { relativeTime } from "@/lib/format/relative-time";
import { AppShell } from "@/components/shell/AppShell";
import { Article } from "@/components/reading/Article";
import { TocNav } from "@/components/reading/TocNav";

type Props = { params: Promise<{ slug: string }> };

export default async function ReadPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [doc, tree] = await Promise.all([
    getDocumentBySlug(slug, user.id),
    getTree(user.id),
  ]);
  if (!doc) notFound();

  const rawHtml = await blocksToHtml(doc.content);
  const safe = sanitizeContentHtml(rawHtml);
  const { items, html } = extractToc(safe);
  const text = safe.replace(/<[^>]+>/g, " ");
  const isOwner = doc.ownerId === user.id;

  return (
    <AppShell email={user.email ?? ""} tree={tree} searchPlaceholder="Search...">
      <div className="flex gap-12">
        <Article
          title={doc.title || "제목 없는 문서"}
          breadcrumb={["Knowledge Base", doc.project].filter(Boolean)}
          html={html}
          author={user.email?.split("@")[0] ?? ""}
          updatedLabel={relativeTime(doc.updatedAt, new Date())}
          readingMin={readingTime(text)}
          editHref={isOwner ? `/edit/${doc.id}` : undefined}
        />
        <TocNav items={items} relatedTitles={[]} />
      </div>
    </AppShell>
  );
}
