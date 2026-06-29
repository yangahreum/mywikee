import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listMyDocuments } from "@/lib/documents/list";
import { createDraftDocument } from "./actions";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const docs = await listMyDocuments(user.id);

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px" }}>
      <header
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}
      >
        <h1 style={{ fontSize: 26, margin: 0 }}>내 문서</h1>
        <form action={createDraftDocument}>
          <button
            type="submit"
            style={{ padding: "8px 14px", background: "#1f5d4f", color: "#fff", border: "none", borderRadius: 6 }}
          >
            새 문서 만들기
          </button>
        </form>
      </header>

      {docs.length === 0 ? (
        <p style={{ color: "#5a6066" }}>아직 문서가 없어요. 첫 문서를 만들어보세요.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {docs.map((d) => (
            <li key={d.id} style={{ border: "1px solid #e3e6ea", borderRadius: 8, padding: "12px 16px" }}>
              <Link href={`/edit/${d.id}`}>{d.title || "제목 없는 문서"}</Link>
              <span style={{ color: "#9098a0", fontSize: 13, marginLeft: 8 }}>
                {d.project} · {new Date(d.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
