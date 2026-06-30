import { test as setup, expect } from "@playwright/test";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { STORAGE_STATE } from "./paths";

/**
 * 세션 주입(storageState) setup.
 *
 * 앱 인증은 Supabase 매직링크(OTP)뿐이라 UI 자동 클릭이 불가하다.
 * 대신 테스트 유저를 email+password 로 직접 signInWithPassword 하여 세션을 얻고,
 * 그 세션을 @supabase/ssr 가 읽는 쿠키 형식 그대로 Playwright storageState 에 저장한다.
 *
 * 쿠키 형식의 정확성 보장:
 *   직접 `sb-<ref>-auth-token` 쿠키를 손으로 만들지 않는다(@supabase/ssr 의
 *   base64-/chunk- 인코딩은 버전마다 다르고 깨지기 쉽다).
 *   대신 앱과 동일한 createServerClient 에 in-memory 쿠키 스토어를 물려
 *   signInWithPassword 를 호출 → @supabase/ssr 가 직접 setAll() 로 만들어 준
 *   바로 그 쿠키들을 캡처한다. 즉 app 의 server.ts/middleware.ts 가 읽는 것과
 *   바이트 단위로 동일한 쿠키가 생성된다.
 */
setup("authenticate", async ({ context }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  // 환경 미비 시 명확히 실패시킨다(통과 위장 금지). 필요한 env 를 메시지로 안내.
  expect(
    url,
    "NEXT_PUBLIC_SUPABASE_URL 가 필요합니다(.env.local)",
  ).toBeTruthy();
  expect(
    anon,
    "NEXT_PUBLIC_SUPABASE_ANON_KEY 가 필요합니다(.env.local)",
  ).toBeTruthy();
  expect(
    email,
    "E2E_TEST_EMAIL 가 필요합니다. 인증 e2e 를 돌리려면 password 로그인 가능한 테스트 유저의 이메일을 설정하세요.",
  ).toBeTruthy();
  expect(
    password,
    "E2E_TEST_PASSWORD 가 필요합니다. 위 테스트 유저의 비밀번호를 설정하세요.",
  ).toBeTruthy();

  // @supabase/ssr 가 setAll() 로 넘겨주는 쿠키를 캡처할 in-memory 스토어.
  const captured: { name: string; value: string; options: CookieOptions }[] = [];
  const store = new Map<string, string>();

  const supabase = createServerClient(url!, anon!, {
    cookies: {
      getAll() {
        return Array.from(store.entries()).map(([name, value]) => ({
          name,
          value,
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          store.set(name, value);
          captured.push({ name, value, options: options ?? {} });
        }
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email!,
    password: password!,
  });

  expect(
    error,
    `signInWithPassword 실패: ${error?.message ?? ""}. 테스트 유저(${email}) 가 존재하고 password 로그인이 활성화되어 있는지 확인하세요.`,
  ).toBeNull();
  expect(data.session, "세션이 생성되지 않았습니다.").toBeTruthy();

  // 세션을 명시 호출해 @supabase/ssr 가 쿠키를 setAll 하도록 보장(이미 위에서 발생).
  expect(captured.length, "auth 쿠키가 캡처되지 않았습니다.").toBeGreaterThan(0);

  // 캡처한 쿠키(이름/값/만료)는 @supabase/ssr 형식 그대로다. Playwright 컨텍스트에 주입.
  const { hostname } = new URL("http://localhost:3000");
  await context.addCookies(
    captured.map(({ name, value, options }) => ({
      name,
      value,
      domain: hostname,
      path: options.path ?? "/",
      httpOnly: options.httpOnly ?? false,
      secure: false,
      sameSite: "Lax" as const,
      expires:
        options.maxAge != null
          ? Math.floor(Date.now() / 1000) + options.maxAge
          : -1,
    })),
  );

  mkdirSync(dirname(STORAGE_STATE), { recursive: true });
  await context.storageState({ path: STORAGE_STATE });
});
