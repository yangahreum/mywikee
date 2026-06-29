import { test, expect } from "@playwright/test";

test("health 엔드포인트가 ok 를 반환한다", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe("ok");
});

test("미인증 사용자는 /me 접근 시 /login 으로 리다이렉트된다", async ({ page }) => {
  await page.goto("/me");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "로그인" })).toBeVisible();
});
