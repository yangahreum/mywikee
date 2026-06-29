import { LogOut } from "lucide-react";

type Props = {
  /** 로그인 사용자 이메일. 표시 이름은 @ 앞부분. */
  email: string;
};

export function UserMenu({ email }: Props) {
  const displayName = email.split("@")[0];
  return (
    <div className="flex items-center gap-2.5 border-t border-border-2 px-2 pt-3">
      <div
        className="h-8 w-8 flex-shrink-0 rounded-full bg-border-strong"
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12.5px] font-semibold">{displayName}</div>
        <div className="text-[11px] text-ink-faint">Personal</div>
      </div>
      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          aria-label="로그아웃"
          className="flex h-7 w-7 items-center justify-center rounded-sm text-ink-secondary hover:bg-chip"
        >
          <LogOut size={15} strokeWidth={1.7} />
        </button>
      </form>
    </div>
  );
}
