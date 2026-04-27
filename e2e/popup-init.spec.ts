// e2e/popup-init.spec.ts — T-803
// 팝업 진입 시나리오: quoteNo 파라미터로 에디터 열기 + 견적 코드 배지 표시 확인

import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/login";

const EDITOR_URL = "/editor/popup?quoteNo=QCE2ETEST001&role=agent";

test.describe("T-803: 팝업 진입 시나리오", () => {
  test("agent로 로그인 후 quoteNo=QCE2ETEST001 로 팝업 진입 시 견적 코드 배지 표시", async ({
    page,
  }) => {
    await loginAs(page, "agent", EDITOR_URL);

    // 견적 코드 배지가 헤더에 보여야 한다
    await expect(
      page.getByText("QCE2ETEST001", { exact: true })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("quoteNo 없이 진입하면 일정 불러오기 버튼 표시", async ({ page }) => {
    await loginAs(page, "agent", "/editor/popup?quoteNo=NOTEXIST999&role=agent");

    // 존재하지 않는 견적 → 빈 에디터 안내 문구 or SearchPopup 자동 오픈
    // "연결된 견적이 없습니다." 텍스트 또는 일정 불러오기 버튼 확인
    const noQuoteText = page.getByText("연결된 견적이 없습니다.");
    const loadBtn = page.getByRole("main").getByRole("button", {
      name: "일정 불러오기",
    });

    // 둘 중 하나가 보여야 한다
    await expect
      .poll(async () => (await noQuoteText.isVisible()) || (await loadBtn.isVisible()), {
        timeout: 10_000,
      })
      .toBe(true);
  });

  test("에디터 헤더에 역할 배지가 표시된다", async ({ page }) => {
    await loginAs(page, "agent", EDITOR_URL);

    // 역할 배지 (AGENT)
    await expect(page.getByText("AGENT", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("에디터 헤더에 버전 배지가 표시된다", async ({ page }) => {
    await loginAs(page, "agent", EDITOR_URL);

    // 버전 배지 (v1.0)
    await expect(page.getByText("v1.0", { exact: true })).toBeVisible({
      timeout: 10_000,
    });
  });
});
