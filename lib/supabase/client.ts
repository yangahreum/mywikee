import { createBrowserClient } from "@supabase/ssr";

/** 클라이언트 컴포넌트(브라우저)용 Supabase 팩토리. SSR 에서 사용 금지. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
