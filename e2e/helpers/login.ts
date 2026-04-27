// e2e/helpers/login.ts
// 재사용 가능한 로그인 헬퍼

import type { Page } from "@playwright/test";

export type TestRole = "partner" | "agent" | "sales";

const CREDENTIALS: Record<TestRole, { email: string; password: string }> = {
  partner: { email: "partner@test.com", password: "password123" },
  agent: { email: "agent@test.com", password: "password123" },
  sales: { email: "sales@test.com", password: "password123" },
};

/**
 * 지정 역할로 로그인 후 세션 쿠키를 획득한다.
 * 로그인 완료 후 editorUrl을 받았다면 해당 URL로 이동한다.
 */
export async function loginAs(
  page: Page,
  role: TestRole,
  editorUrl?: string
): Promise<void> {
  const { email, password } = CREDENTIALS[role];

  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');

  // 로그인 성공 → 홈으로 리다이렉트 대기
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 15_000 });

  // 에디터 URL이 지정된 경우 이동
  if (editorUrl) {
    await page.goto(editorUrl);
    await page.waitForLoadState("networkidle");
  }
}
