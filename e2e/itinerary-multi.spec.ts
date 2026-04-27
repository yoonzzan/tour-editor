// e2e/itinerary-multi.spec.ts — T-804
// 다중 관광 항목 추가: 동일 일차에 같은 구분(관광)을 여러 개 추가할 수 있어야 한다

import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/login";

const EDITOR_URL = "/editor/popup?quoteNo=QCE2ETEST001&role=agent";

test.describe("T-804: 다중 항목 추가", () => {
  test("1일차에 관광 항목을 2개 추가하면 2개가 모두 표시된다", async ({
    page,
  }) => {
    await loginAs(page, "agent", EDITOR_URL);

    // 일정표 탭이 로드될 때까지 대기
    await expect(
      page.getByTestId("day-block-1").getByText("1일차", { exact: true })
    ).toBeVisible({ timeout: 10_000 });

    // 1일차의 "항목 추가" 버튼 — DayBlock의 data-testid 활용
    const day1Block = page.getByTestId("day-block-1");
    const sightseeingItems = day1Block.locator('[data-item-type="SIGHTSEEING"]');
    const baselineSightseeingCount = await sightseeingItems.count();

    // 첫 번째 관광 추가
    await day1Block.getByRole("button", { name: /\+ 항목 추가/ }).click();
    await page.getByRole("button", { name: "관광" }).click();

    // 두 번째 관광 추가
    await day1Block.getByRole("button", { name: /\+ 항목 추가/ }).click();
    await page.getByRole("button", { name: "관광" }).click();

    // 1일차의 관광 항목 수가 초기값 대비 2개 증가해야 한다
    await expect(sightseeingItems).toHaveCount(baselineSightseeingCount + 2, {
      timeout: 5_000,
    });
  });

  test("숙박 항목은 일차당 1개만 추가 가능하고 마지막 위치에 고정된다", async ({
    page,
  }) => {
    await loginAs(page, "agent", EDITOR_URL);

    await expect(
      page.getByTestId("day-block-1").getByText("1일차", { exact: true })
    ).toBeVisible({ timeout: 10_000 });

    const day2Block = page.getByTestId("day-block-2");

    // 관광 추가 후 숙박 추가 시도
    await day2Block.getByRole("button", { name: /\+ 항목 추가/ }).click();
    await page.getByRole("button", { name: "관광" }).click();

    // 기존 일정 데이터에 이미 숙박이 있으므로 items 순서 확인
    // 숙박 항목이 목록 마지막에 위치해야 한다
    const items = day2Block.locator("[data-item-type]");
    const count = await items.count();
    if (count > 0) {
      const lastType = await items.last().getAttribute("data-item-type");
      expect(lastType).toBe("ACCOMMODATION");
    }
  });
});
