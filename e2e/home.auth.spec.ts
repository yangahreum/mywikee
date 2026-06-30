import { test, expect } from "@playwright/test";
import { watchConsole } from "./console-watch";

/**
 * 인증 후 홈(/) 스모크.
 *
 * storageState(세션 주입)로 인증된 컨텍스트에서 홈을 연다.
 * 미인증이면 /login 으로 리다이렉트되므로, 인증 성공 자체가 / 에 머무는 것으로 확인된다.
 * 트리/대시보드 hydration 등 런타임 에러는 콘솔 감시로 잡아 0건을 단언한다.
 */
test("인증된 사용자의 홈(/) 로드 시 콘솔 에러/경고가 없다", async ({ page }) => {
  const watcher = watchConsole(page);

  await page.goto("/", { waitUntil: "networkidle" });

  // 인증 상태이므로 /login 으로 튕기지 않고 / 에 머문다.
  await expect(page).toHaveURL(/\/(?:$|\?)/);

  // hydration mismatch 를 포함한 콘솔 error/warning 0건.
  expect(
    watcher.messages,
    `홈 로드 중 콘솔 error/warning 발생:\n${watcher.messages.join("\n")}`,
  ).toEqual([]);
  // 런타임 예외(pageerror) 0건.
  expect(
    watcher.pageErrors,
    `홈 로드 중 런타임 예외 발생:\n${watcher.pageErrors.join("\n")}`,
  ).toEqual([]);
});
