import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDocument } from "@/lib/documents/get";
import { Editor } from "./editor";
import { AppShell } from "@/components/shell/AppShell";

type Props = { params: Promise<{ id: string }> };

export default async function EditPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const doc = await getDocument(id, user.id);
  if (!doc) notFound();

  return (
    <AppShell
      email={user.email ?? ""}
      sidebarWidth={212}
      searchPlaceholder="Search..."
      variant="bare"
    >
      <Editor id={doc.id} initialTitle={doc.title} initialContent={doc.content} />
    </AppShell>
  );
}
