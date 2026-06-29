"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { UserMenu } from "./UserMenu";

type Props = {
  email: string;
  searchPlaceholder?: string;
  /** 사이드바 너비 (홈 228, 읽기·편집 212). */
  sidebarWidth?: number;
  children: React.ReactNode;
};

export function AppShell({
  email,
  searchPlaceholder = "Quick find...",
  sidebarWidth = 228,
  children,
}: Props) {
  const pathname = usePathname();
  return (
    <div className="flex h-screen bg-app text-ink">
      <Sidebar
        pathname={pathname}
        width={sidebarWidth}
        userSlot={<UserMenu email={email} />}
      />
      <main className="flex flex-1 flex-col overflow-hidden">
        <Topbar searchPlaceholder={searchPlaceholder} />
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[940px] px-8 py-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
