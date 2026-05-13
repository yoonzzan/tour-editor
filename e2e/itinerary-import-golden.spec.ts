import { readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/login";

const EDITOR_URL = "/editor/popup?quoteNo=QCE2ETEST001&role=agent";
const FIXTURE_DIR = path.resolve(process.cwd(), "tests/fixtures/itinerary-golden");
const FULL_E2E = process.env.ITINERARY_GOLDEN_FULL_E2E === "1";
const REPRESENTATIVE_MARKERS = [
  "인센티브 대만 일정표 샘플",
  "싱가포르 원가관리",
  "홋카이도",
];

interface FixtureCase {
  name: string;
  absolutePath: string;
}

function allXlsxFixtures(): FixtureCase[] {
  return readdirSync(FIXTURE_DIR)
    .filter((name) => name.toLowerCase().endsWith(".xlsx"))
    .sort((left, right) => left.localeCompare(right))
    .map((name) => ({
      name,
      absolutePath: path.join(FIXTURE_DIR, name),
    }));
}

function representativeFixtures(): FixtureCase[] {
  const fixtures = allXlsxFixtures();
  const selected = REPRESENTATIVE_MARKERS.map((marker) =>
    fixtures.find((fixture) => fixture.name.normalize("NFC").includes(marker)),
  ).filter((fixture): fixture is FixtureCase => fixture !== undefined);

  if (selected.length === REPRESENTATIVE_MARKERS.length) return selected;
  return fixtures.slice(0, Math.max(3, selected.length));
}

const fixtureCases = FULL_E2E ? allXlsxFixtures() : representativeFixtures();

test.describe("itinerary golden fixture auto import", () => {
  for (const fixture of fixtureCases) {
    test(`${fixture.name} uploads and renders imported itinerary`, async ({ page }) => {
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });

      await loginAs(page, "agent", EDITOR_URL);
      await page.getByRole("button", { name: "일정 불러오기" }).last().click();
      await page.getByRole("button", { name: "파일 첨부" }).click();
      await page.getByLabel("파일 선택").setInputFiles(fixture.absolutePath);
      await expect(page.getByText(fixture.name)).toBeVisible();

      await page.getByRole("button", { name: "일정 불러오기" }).last().click();

      const dayOne = page.getByTestId("day-block-1");
      await expect(dayOne.getByText("1일차", { exact: true })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.locator("[data-item-type]").first()).toBeVisible({
        timeout: 10_000,
      });
    });
  }
});
