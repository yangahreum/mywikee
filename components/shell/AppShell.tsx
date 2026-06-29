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
  /**
   * 콘텐츠 영역 변형.
   * - "default": 쿨그레이(bg-app) 배경 + 중앙 정렬 max-940 래퍼 (홈·읽기 — 카드 대비).
   * - "bare": 흰(bg-surface) 배경 전체폭, 래퍼 없음 (에디터 — 청사진 Frame 3).
   */
  variant?: "default" | "bare";
  children: React.ReactNode;
};

export function AppShell({
  email,
  searchPlaceholder = "Quick find...",
  sidebarWidth = 228,
  variant = "default",
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
          {variant === "bare" ? (
            <div className="min-h-full bg-surface">{children}</div>
          ) : (
            <div className="mx-auto max-w-[940px] px-8 py-8">{children}</div>
          )}
        </div>
      </main>
    </div>
  );
}
