import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("http://localhost:4000/**", (route) => route.abort());
});

test("proposal browsing has no overflow and meets the accessibility gate", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Propozimet" })).toBeVisible();
  const overflow = await page
    .locator(".site-shell")
    .evaluate((shell) => shell.scrollWidth > shell.clientWidth);
  expect(overflow).toBe(false);
  if ((testInfo.project.use.viewport?.width ?? 1000) < 640) {
    const small = await page
      .locator("button:visible,input:visible,textarea:visible,select:visible")
      .evaluateAll((elements) =>
        elements
          .filter((element) => !element.hasAttribute("data-nextjs-dev-tools-button"))
          .filter((element) => {
            const box = element.getBoundingClientRect();
            return box.width < 44 || box.height < 44;
          })
          .map((element) => element.outerHTML),
      );
    expect(small).toEqual([]);
  }
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")),
  ).toEqual([]);
  await expect(page).toHaveScreenshot("proposal-home.png", {
    animations: "disabled",
    maxDiffPixelRatio: 0.01,
  });
});

test("mobile uses dedicated list and detail navigation", async ({ page }, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 1000) >= 768);
  await page.goto("/");
  await expect(page.locator(".proposal-list")).toBeVisible();
  await expect(page.locator(".proposal-detail")).toBeHidden();
  await page.locator(".proposal-card").first().click();
  await expect(page.locator(".proposal-detail")).toBeVisible();
  await expect(page.locator(".proposal-list")).toBeHidden();
  await page.getByRole("button", { name: "Të gjitha propozimet" }).click();
  await expect(page.locator(".proposal-list")).toBeVisible();
});

test("proposal detail hides the split before voting and survives zoom", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await expect(page.getByText("Rezultati shfaqet pasi të votosh")).toBeVisible();
  await expect(page.getByText(/% mbështesin/)).toHaveCount(0);
  if ((testInfo.project.use.viewport?.width ?? 1000) <= 412) {
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    expect(
      await page.locator(".site-shell").evaluate((shell) => shell.scrollWidth > shell.clientWidth),
    ).toBe(false);
  }
});
