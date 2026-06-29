import { Home, History, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

/** 사이드바 주 네비 (청사진 Frame 1 — Home·Recent + 하단 KNOWLEDGE TREE). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/recent", label: "Recent", icon: History },
];

/** 현재 pathname 기준 항목 활성 여부. 홈("/")은 정확히 일치할 때만. */
export function isActiveNav(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}
