import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { listMyDocuments } from "@/lib/documents/list";
import { createDraftDocument } from "./actions";
import { AppShell } from "@/components/shell/AppShell";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const docs = await listMyDocuments(user.id);

  return (
    <AppShell email={user.email ?? ""}>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="m-0 font-serif text-3xl font-semibold tracking-tight">
          내 문서
        </h1>
        <form action={createDraftDocument}>
          <button
            type="submit"
            className="flex h-[38px] items-center gap-1.5 rounded-md bg-primary px-4 text-[12.5px] font-medium text-primary-fg"
          >
            <Plus size={15} strokeWidth={2.2} /> 새 문서
          </button>
        </form>
      </header>

      {docs.length === 0 ? (
        <p className="text-ink-secondary">
          아직 문서가 없어요. 첫 문서를 만들어보세요.
        </p>
      ) : (
        <ul className="flex list-none flex-col gap-2 p-0">
          {docs.map((d) => (
            <li
              key={d.id}
              className="rounded-lg border border-border bg-surface px-4 py-3"
            >
              <Link href={`/edit/${d.id}`} className="text-ink">
                {d.title || "제목 없는 문서"}
              </Link>
              <span className="ml-2 text-[13px] text-ink-faint">
                {d.project} ·{" "}
                {new Date(d.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
