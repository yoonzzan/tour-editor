// e2e/version-readonly.spec.ts — T-806
// 구버전 읽기 전용 확인
// QCE2ETEST002 는 global-setup 에서 v1.0 + v1.1 으로 생성됨

import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/login";

const EDITOR_URL = "/editor/popup?quoteNo=QCE2ETEST002&role=agent";

test.describe("T-806: 구버전 읽기 전용", () => {
  test("버전 이력에서 v1.0 미리보기 클릭 시 읽기 전용 배너가 표시된다", async ({
    page,
  }) => {
    await loginAs(page, "agent", EDITOR_URL);

    // 에디터 로드 (최신 버전 v1.1)
    await expect(page.getByText("v1.1", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // 버전 이력 열기
    await page.getByRole("button", { name: "버전 이력" }).click();

    // v1.0 항목의 미리보기 버튼 클릭
    // VersionHistory 컴포넌트: <li> 안에 버전 번호 텍스트 + 미리보기 <button>
    const v10Item = page.locator("li").filter({ hasText: "v1.0" });
    await expect(v10Item).toBeVisible({ timeout: 5_000 });
    await v10Item.getByRole("button", { name: "미리보기" }).click();

    // 읽기 전용 배너 표시 확인
    await expect(
      page.getByText(/읽기 전용 미리보기/)
    ).toBeVisible({ timeout: 5_000 });

    // 배너에 v1.0 버전 번호가 포함되어야 한다
    await expect(
      page.getByText(/읽기 전용 미리보기 — v1\.0/)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("읽기 전용 배너의 닫기 버튼을 클릭하면 배너가 사라진다", async ({
    page,
  }) => {
    await loginAs(page, "agent", EDITOR_URL);

    await expect(page.getByText("v1.1", { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // 버전 이력 → v1.0 미리보기
    await page.getByRole("button", { name: "버전 이력" }).click();
    const v10Item = page.locator("li").filter({ hasText: "v1.0" });
    await v10Item.getByRole("button", { name: "미리보기" }).click();

    // 배너 표시 확인
    const readonlyBanner = page.locator("text=/읽기 전용 미리보기 — v1\\.0/");
    await expect(readonlyBanner).toBeVisible({
      timeout: 5_000,
    });

    // 닫기 버튼 클릭
    await readonlyBanner
      .locator("..")
      .getByRole("button", { name: "닫기" })
      .click();

    // 배너가 사라져야 한다
    await expect(readonlyBanner).not.toBeVisible();
  });
});
