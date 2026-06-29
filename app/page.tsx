import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/home/get-dashboard";
import { getTree } from "@/lib/tree/get-tree";
import { AppShell } from "@/components/shell/AppShell";
import { PageHeader } from "@/components/home/PageHeader";
import { HomeTabs } from "@/components/home/HomeTabs";
import { JumpBackIn } from "@/components/home/JumpBackIn";
import { RecentlyEditedTable } from "@/components/home/RecentlyEditedTable";
import { Starred } from "@/components/home/rail/Starred";
import { RecentActivity } from "@/components/home/rail/RecentActivity";
import { QuickAccess } from "@/components/home/rail/QuickAccess";
import { Footer } from "@/components/home/Footer";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ totalCount, recent }, tree] = await Promise.all([
    getDashboardData(user.id),
    getTree(user.id),
  ]);
  const now = new Date();

  return (
    <AppShell email={user.email ?? ""} tree={tree}>
      <PageHeader totalCount={totalCount} />
      <HomeTabs />
      <JumpBackIn docs={recent} now={now} />
      <div className="grid grid-cols-[1fr_290px] items-start gap-7">
        <div>
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="m-0 font-serif text-[18px] font-semibold">Recently edited</h2>
          </div>
          <RecentlyEditedTable docs={recent} now={now} />
        </div>
        <div className="flex flex-col gap-5">
          <Starred />
          <RecentActivity docs={recent} now={now} />
          <QuickAccess />
        </div>
      </div>
      <Footer year={now.getFullYear()} />
    </AppShell>
  );
}
