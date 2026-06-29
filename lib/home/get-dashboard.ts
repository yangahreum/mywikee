import { createClient } from "@/lib/supabase/server";
import type { DashboardData, DashboardDoc } from "./types";

type Row = {
  id: string;
  title: string | null;
  project: string | null;
  updated_at: string;
};

/** DB row → DashboardDoc. (단위 테스트 대상) */
export function mapDashboardRow(row: Row): DashboardDoc {
  return {
    id: row.id,
    title: row.title ?? "",
    project: row.project ?? "",
    updatedAt: row.updated_at,
  };
}

/** 홈 대시보드 데이터: 총 개수 + 최근 수정 N건(updated_at desc). */
export async function getDashboardData(
  ownerId: string,
  recentLimit = 8,
): Promise<DashboardData> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  const { data, error } = await supabase
    .from("documents")
    .select("id, title, project, updated_at")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false })
    .limit(recentLimit);

  const recent = error || !data ? [] : data.map(mapDashboardRow);
  return { totalCount: count ?? 0, recent };
}
