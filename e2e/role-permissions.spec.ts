// e2e/role-permissions.spec.ts — T-808
// 역할별 버튼 표시/숨김 확인
// partner: 항공 조회 버튼 숨김
// sales:   항공 조회 + 저장 모두 표시
// agent:   항공 조회 + 저장 모두 표시

import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/login";

const BASE_QUOTE = "QCE2ETEST001";

async function fillLoginForm(page: import("@playwright/test").Page, email: string) {
  await page.fill("#email", email);
  await page.fill("#password", "password123");
  await page.click('button[type="submit"]');
}

test.describe("T-808: 역할별 권한", () => {
  test("partner 역할 — 항공 조회 버튼이 표시되지 않는다", async ({ page }) => {
    await loginAs(
      page,
      "partner",
      `/editor/popup?quoteNo=${BASE_QUOTE}&role=partner`
    );

    // 에디터 로드 대기
    await expect(
      page.getByTestId("day-block-1").getByText("1일차", { exact: true })
    ).toBeVisible({ timeout: 10_000 });

    // 항공 조회 버튼이 없어야 한다
    await expect(
      page.getByRole("button", { name: "항공 조회" })
    ).not.toBeVisible();

    // 저장 버튼은 보여야 한다 (partner 는 편집 가능)
    await expect(page.getByRole("button", { name: "저장" })).toBeVisible();
  });

  test("sales 역할 — 항공 조회 + 저장 버튼이 모두 표시된다", async ({ page }) => {
    await loginAs(
      page,
      "sales",
      `/editor/popup?quoteNo=${BASE_QUOTE}&role=sales`
    );

    await expect(
      page.getByTestId("day-block-1").getByText("1일차", { exact: true })
    ).toBeVisible({ timeout: 10_000 });

    // 저장 버튼 표시 (disabled 일 수 있으나 존재해야 함)
    await expect(page.getByRole("button", { name: "저장" })).toBeVisible();

    // 항공 조회 버튼은 보여야 한다
    await expect(
      page.getByRole("button", { name: "항공 조회" })
    ).toBeVisible();
  });

  test("agent 역할 — 항공 조회 + 저장 버튼이 모두 표시된다", async ({
    page,
  }) => {
    await loginAs(
      page,
      "agent",
      `/editor/popup?quoteNo=${BASE_QUOTE}&role=agent`
    );

    await expect(
      page.getByTestId("day-block-1").getByText("1일차", { exact: true })
    ).toBeVisible({ timeout: 10_000 });

    // 항공 조회 버튼 표시
    await expect(
      page.getByRole("button", { name: "항공 조회" })
    ).toBeVisible();

    // 저장 버튼 표시 (disabled 일 수 있으나 존재해야 함)
    await expect(page.getByRole("button", { name: "저장" })).toBeVisible();
  });

  test("역할 배지가 헤더에 올바르게 표시된다", async ({ page }) => {
    // agent 역할 확인
    await loginAs(
      page,
      "agent",
      `/editor/popup?quoteNo=${BASE_QUOTE}&role=agent`
    );
    await expect(page.getByText("AGENT", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("sales 역할 배지가 헤더에 표시된다", async ({ page }) => {
    await loginAs(
      page,
      "sales",
      `/editor/popup?quoteNo=${BASE_QUOTE}&role=sales`
    );
    await expect(page.getByText("SALES", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("URL role과 세션 role이 다르면 에디터 진입을 차단한다", async ({ page }) => {
    await loginAs(
      page,
      "agent",
      `/editor/popup?quoteNo=${BASE_QUOTE}&role=partner`
    );

    await expect(page.getByText("권한이 없습니다.")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("button", { name: "항공 조회" })
    ).not.toBeVisible();
  });

  test("미로그인 상태에서 팝업 URL 접근 후 로그인하면 원래 팝업으로 복귀한다", async ({
    page,
  }) => {
    await page.goto(`/editor/popup?quoteNo=${BASE_QUOTE}&role=partner`);

    await expect(page).toHaveURL(/\/login\?callbackUrl=/);
    await fillLoginForm(page, "partner@test.com");

    await expect(page).toHaveURL(
      new RegExp(`/editor/popup\\?quoteNo=${BASE_QUOTE}&role=partner`)
    );
    await expect(
      page.getByTestId("day-block-1").getByText("1일차", { exact: true })
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("button", { name: "항공 조회" })
    ).not.toBeVisible();
  });
});
