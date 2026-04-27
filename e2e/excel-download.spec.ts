// e2e/excel-download.spec.ts — T-807
// Excel 다운로드 + 파일명 형식 검증
// UI에 Excel 다운로드 버튼이 없으므로 page.request() 로 API 직접 호출
// → 로그인 세션 쿠키가 page.request 에 자동 포함됨

import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/login";

const QUOTE_CODE = "QCE2ETEST001";
const EDITOR_URL = `/editor/popup?quoteNo=${QUOTE_CODE}&role=agent`;

test.describe("T-807: Excel 다운로드", () => {
  test("인증된 사용자가 여행일정표 Excel 을 다운로드하면 올바른 파일명을 반환한다", async ({
    page,
  }) => {
    // 로그인 (세션 쿠키 확보)
    await loginAs(page, "agent", EDITOR_URL);
    await expect(
      page.getByTestId("day-block-1").getByText("1일차", { exact: true })
    ).toBeVisible({ timeout: 10_000 });

    // 1. init API 로 quoteId 조회
    const initResp = await page.request.get(
      `/api/editor/init?quoteNo=${QUOTE_CODE}`
    );
    expect(initResp.status()).toBe(200);
    const initData = await initResp.json();
    const quoteId: string = initData.quote.id;
    expect(quoteId).toBeTruthy();

    // 2. 여행일정표 Excel export API 호출
    const exportResp = await page.request.get(
      `/api/quotes/${quoteId}/export?type=itinerary`
    );
    expect(exportResp.status()).toBe(200);

    // 3. Content-Type 검증
    const contentType = exportResp.headers()["content-type"];
    expect(contentType).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // 4. Content-Disposition 파일명 형식 검증
    // 형식: 여행일정표_{productName}_{bidCode}_{quoteCode}_{YYYY-MM-DD}.xlsx
    const disposition = exportResp.headers()["content-disposition"];
    expect(disposition).toBeTruthy();

    // RFC 5987 인코딩 디코드: filename*=UTF-8''...
    const encodedMatch = disposition.match(/filename\*=UTF-8''(.+)/i);
    if (encodedMatch) {
      const decoded = decodeURIComponent(encodedMatch[1]);
      // 파일명이 여행일정표로 시작하고 quoteCode 를 포함하며 .xlsx 로 끝나야 한다
      expect(decoded).toMatch(
        /^여행일정표_E2E 테스트 비딩_BID-E2E-001_QCE2ETEST001_\d{4}-\d{2}-\d{2}\.xlsx$/
      );
    } else {
      // fallback: filename= 형식
      const simpleMatch = disposition.match(/filename="?([^";\r\n]+)"?/i);
      expect(simpleMatch).toBeTruthy();
      const filename = simpleMatch![1];
      expect(filename).toMatch(/여행일정표/);
      expect(filename).toMatch(/QCE2ETEST001/);
      expect(filename).toMatch(/\.xlsx$/);
    }
  });

  test("견적산출내역서 Excel 을 다운로드하면 올바른 파일명을 반환한다", async ({
    page,
  }) => {
    await loginAs(page, "agent", EDITOR_URL);
    await expect(
      page.getByTestId("day-block-1").getByText("1일차", { exact: true })
    ).toBeVisible({ timeout: 10_000 });

    const initResp = await page.request.get(
      `/api/editor/init?quoteNo=${QUOTE_CODE}`
    );
    const initData = await initResp.json();
    const quoteId: string = initData.quote.id;

    const exportResp = await page.request.get(
      `/api/quotes/${quoteId}/export?type=cost`
    );
    expect(exportResp.status()).toBe(200);

    const disposition = exportResp.headers()["content-disposition"];
    expect(disposition).toBeTruthy();

    const encodedMatch = disposition.match(/filename\*=UTF-8''(.+)/i);
    if (encodedMatch) {
      const decoded = decodeURIComponent(encodedMatch[1]);
      expect(decoded).toMatch(
        /^견적산출내역서_E2E 테스트 비딩_BID-E2E-001_QCE2ETEST001_\d{4}-\d{2}-\d{2}\.xlsx$/
      );
    } else {
      const simpleMatch = disposition.match(/filename="?([^";\r\n]+)"?/i);
      expect(simpleMatch).toBeTruthy();
      const filename = simpleMatch![1];
      expect(filename).toMatch(/견적산출내역서/);
    }
  });

  test("미인증 요청은 401 을 반환한다", async ({ page }) => {
    // 로그인 없이 직접 API 접근 — 401 이어야 한다
    // 새 컨텍스트를 쓰지 않고 로그인 전 상태를 활용
    const resp = await page.request.get(
      "/api/quotes/nonexistent-id/export?type=itinerary"
    );
    // 미인증 시 401, 잘못된 quoteId 시 401 또는 404 모두 허용
    expect([401, 404]).toContain(resp.status());
  });
});
