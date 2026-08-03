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
    maxDiffPixelRatio: 0.07,
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

test("proposal search is represented in the URL and restores on load", async ({ page }) => {
  await page.goto("/");
  const search = page.getByRole("searchbox", { name: "Kërko propozime" });
  await search.fill("hije");
  await expect(page).toHaveURL(/\?q=hije$/);
  await expect(page.locator(".proposal-card")).toHaveCount(1);
  await page.reload();
  await expect(search).toHaveValue("hije");
  await expect(page.locator(".proposal-card")).toHaveCount(1);
});

test("proposal filters are URL-backed and proposal links use readable slugs", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Filtro sipas kategorisë" }).selectOption("transport");
  await page.getByRole("combobox", { name: "Filtro sipas statusit" }).selectOption("voting_open");
  await expect(page).toHaveURL(/category=transport/);
  await expect(page).toHaveURL(/status=voting_open/);
  await expect(page.locator(".proposal-card")).toHaveCount(1);
  await page.locator(".proposal-card").first().click();
  await expect(page).toHaveURL(/\/propozime\/me-shume-hije-ne-stacionet-e-autobuseve--11111111/);
  await page.reload();
  await expect(page.getByRole("combobox", { name: "Filtro sipas kategorisë" })).toHaveValue(
    "transport",
  );
});

test("section navigation scrolls and marks the active destination", async ({ page }, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 0) < 1024);
  await page.goto("/");
  const navigation = page.locator(".topbar > nav");
  await navigation.getByRole("link", { name: "Si funksionon" }).click();
  await expect(page).toHaveURL(/#si-funksionon$/);
  await expect(navigation.getByRole("link", { name: "Si funksionon" })).toHaveAttribute(
    "aria-current",
    "location",
  );
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  const activeBoxShadow = await navigation
    .getByRole("link", { name: "Si funksionon" })
    .evaluate((element) => getComputedStyle(element).boxShadow);
  expect(activeBoxShadow).toBe("none");
  const notification = page.getByRole("button", { name: "Njoftimet", exact: true });
  await expect(notification).toBeVisible();
  await expect(notification).toHaveText("");
});

test("desktop proposal title spans the detail before content and voting columns", async ({
  page,
}, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 0) < 1180);
  await page.goto("/");
  const detail = page.locator(".proposal-detail");
  const geometry = await detail.evaluate((article) => {
    const title = article.querySelector(":scope > h2")?.getBoundingClientRect();
    const content = article.querySelector(".proposal-content")?.getBoundingClientRect();
    const vote = article.querySelector(".vote-box")?.getBoundingClientRect();
    const firstBadge = article
      .querySelector(".detail-meta [data-slot='badge']")
      ?.getBoundingClientRect();
    const share = article.querySelector(".share-button")?.getBoundingClientRect();
    const bounds = article.getBoundingClientRect();
    const titleStyle = title ? getComputedStyle(article.querySelector(":scope > h2")!) : null;
    return {
      titleLeftInset: title ? title.left - bounds.left : -1,
      titleRightInset: title ? bounds.right - title.right : -1,
      titleWidth: title?.width ?? 0,
      detailWidth: bounds.width,
      titleLineCount:
        title && titleStyle ? title.height / Number.parseFloat(titleStyle.lineHeight) : 999,
      columnsAligned: content && vote ? Math.abs(content.top - vote.top) : 999,
      columnsSeparated: content && vote ? vote.left - content.right : -1,
      shareFirstRowDelta:
        firstBadge && share
          ? Math.abs(firstBadge.top + firstBadge.height / 2 - (share.top + share.height / 2))
          : 999,
      shareRightInset: share ? bounds.right - share.right : -1,
    };
  });
  expect(Math.abs(geometry.titleLeftInset - geometry.titleRightInset)).toBeLessThanOrEqual(1);
  expect(geometry.titleWidth).toBeGreaterThan(geometry.detailWidth * 0.85);
  expect(geometry.titleLineCount).toBeLessThan(1.1);
  expect(geometry.columnsAligned).toBeLessThanOrEqual(1);
  expect(geometry.columnsSeparated).toBeGreaterThanOrEqual(20);
  expect(geometry.shareFirstRowDelta).toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.shareRightInset - geometry.titleRightInset)).toBeLessThanOrEqual(1);
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
