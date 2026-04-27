// e2e/version-create.spec.ts — T-805
// 저장 → 버전 생성 → 이력 확인
// QCE2ETEST001 (v1.0 only) 에 편집 후 저장하면 v1.1 이 생성된다

import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/login";

const EDITOR_URL = "/editor/popup?quoteNo=QCE2ETEST001&role=agent";

test.describe("T-805: 버전 생성", () => {
  test("일정 내용 수정 후 저장하면 새 버전(v1.1)이 버전 이력에 표시된다", async ({
    page,
  }) => {
    await loginAs(page, "agent", EDITOR_URL);

    // 에디터 로드 대기
    await expect(
      page.getByTestId("day-block-1").getByText("1일차", { exact: true })
    ).toBeVisible({ timeout: 10_000 });

    // 1일차 첫 번째 항목 내용 변경 → isDirty = true
    const day1Block = page.getByTestId("day-block-1");
    await day1Block.getByLabel("항목 내용").first().fill("수정된 내용 테스트");

    // 저장 버튼 활성화 확인
    const saveBtn = page.getByRole("button", { name: "저장", exact: true }).first();
    await expect(saveBtn).toBeEnabled({ timeout: 5_000 });
    await saveBtn.click();

    // 변경 사유 모달 대기
    const saveForm = page.locator("form").filter({
      has: page.locator("textarea#changeReason"),
    });
    const changeReasonTextarea = saveForm.locator("textarea#changeReason");
    await expect(changeReasonTextarea).toBeVisible({ timeout: 5_000 });
    await changeReasonTextarea.fill("E2E 테스트 — 버전 생성");

    const saveRequest = page.waitForResponse(
      (res) =>
        res.request().method() === "POST" &&
        /\/api\/quotes\/[^/]+\/versions$/.test(res.url())
    );
    await saveForm.getByRole("button", { name: "저장", exact: true }).click();
    const savedVersionResponse = await saveRequest;
    expect(savedVersionResponse.status()).toBe(201);
    const { versionNo } = (await savedVersionResponse.json()) as {
      versionNo: string;
    };

    // 저장 완료 후 상단 버전 배지가 새 버전으로 바뀌어야 한다
    await expect(page.getByText(versionNo, { exact: true })).toBeVisible({
      timeout: 10_000,
    });

    // 버전 이력 열기
    await page.getByRole("button", { name: "버전 이력" }).click();
    await expect(page.getByText(versionNo)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("v1.0")).toBeVisible({ timeout: 5_000 });
  });
});
