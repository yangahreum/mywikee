import { defineConfig } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { STORAGE_STATE } from "./e2e/paths";

// .env.local 를 의존성 없이 Playwright 프로세스에 로드(setup 의 Supabase 로그인용).
// Next dev 서버는 자체적으로 .env.local 을 읽지만, auth.setup.ts 가 도는
// Playwright 워커 프로세스에는 별도로 주입해야 한다. 이미 설정된 env 는 덮어쓰지 않는다.
try {
  const raw = readFileSync(join(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
} catch {
  // .env.local 없으면 무시 — 미인증 스모크는 영향 없음.
}

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000" },
  projects: [
    // 1) 세션 주입: 테스트 유저로 로그인 → storageState 저장.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // 2) 미인증 스모크: 세션 없이 동작(health, /me→/login). setup 불필요.
    {
      name: "anon",
      testMatch: /flow\.spec\.ts/,
    },
    // 3) 인증 스모크: setup 의 storageState 재사용. setup 선행 의존.
    {
      name: "authenticated",
      testMatch: /\.auth\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: STORAGE_STATE },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
