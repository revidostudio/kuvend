import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("http://localhost:4000/**", (route) => route.abort());
});

async function openMobileFilters(page: import("@playwright/test").Page) {
  await expect(page.getByRole("heading", { name: "Propozimet" })).toBeVisible();
  await page.evaluate(() => document.getElementById("propozimet")?.scrollIntoView());
  const filters = page.getByRole("button", { name: "Më shumë filtra" });
  await expect(filters).toBeVisible();
  await filters.click();
}

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

test("mobile proposal permalink is a focused detail screen", async ({ page }, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 1000) >= 768);
  await page.goto(
    "/propozime/kalime-me-te-sigurta-prane-shkollave--33333333-3333-4333-8333-333333333333",
  );

  await expect(page.locator(".proposal-detail")).toBeVisible();
  await expect(page.locator(".hero")).toBeHidden();
  await expect(page.locator(".section-heading")).toBeHidden();
  await expect(page.locator(".how")).toBeHidden();
  await expect(page.locator('[data-slot="public-footer"]')).toBeHidden();
  await expect(page.getByRole("button", { name: "Mbështes" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Kundërshtoj" })).toBeVisible();

  const layout = await page.locator(".proposal-detail").evaluate((detail) => {
    const vote = detail.querySelector(".vote-box");
    const problem = [...detail.querySelectorAll("h3")].find(
      (heading) => heading.textContent?.trim() === "Problemi",
    );
    const voteBox = vote?.getBoundingClientRect();
    const problemBox = problem?.getBoundingClientRect();
    return {
      pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
      votePosition: vote ? getComputedStyle(vote).position : "missing",
      voteBeforeProblem: Boolean(voteBox && problemBox && voteBox.bottom < problemBox.top),
    };
  });
  expect(layout).toEqual({
    pageOverflow: false,
    votePosition: "static",
    voteBeforeProblem: true,
  });
});

test("proposal search is represented in the URL and restores on load", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  if ((testInfo.project.use.viewport?.width ?? 1000) < 640) {
    await openMobileFilters(page);
  }
  let search = page.getByRole("searchbox", { name: "Kërko propozime" });
  await search.fill("hije");
  await expect(page).toHaveURL(/\?q=hije$/);
  await expect(page.locator(".proposal-card")).toHaveCount(1);
  await page.reload();
  if ((testInfo.project.use.viewport?.width ?? 1000) < 640) {
    await openMobileFilters(page);
    search = page.getByRole("searchbox", { name: "Kërko propozime" });
  }
  await expect(search).toHaveValue("hije");
  await expect(page.locator(".proposal-card")).toHaveCount(1);
});

test("proposal filters are URL-backed and proposal links use readable slugs", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  if ((testInfo.project.use.viewport?.width ?? 1000) < 640) {
    await openMobileFilters(page);
    await page.getByLabel("Kategoria", { exact: true }).selectOption("transport");
    await page.getByLabel("Statusi", { exact: true }).selectOption("voting_open");
    await page.getByRole("button", { name: /Shfaq \d+ rezultate/ }).click();
  } else {
    await page.getByRole("combobox", { name: "Filtro sipas kategorisë" }).selectOption("transport");
    await page.getByRole("combobox", { name: "Filtro sipas statusit" }).selectOption("voting_open");
  }
  await expect(page).toHaveURL(/category=transport/);
  await expect(page).toHaveURL(/status=voting_open/);
  await expect(page.locator(".proposal-card")).toHaveCount(1);
  await page.locator(".proposal-card").first().click();
  await expect(page).toHaveURL(/\/propozime\/me-shume-hije-ne-stacionet-e-autobuseve--11111111/);
  await page.reload();
  if ((testInfo.project.use.viewport?.width ?? 1000) < 900) {
    await page.getByRole("button", { name: "Të gjitha propozimet" }).click();
  }
  if ((testInfo.project.use.viewport?.width ?? 1000) < 640) {
    await openMobileFilters(page);
    await expect(page.getByLabel("Kategoria", { exact: true })).toHaveValue("transport");
  } else {
    await expect(page.getByRole("combobox", { name: "Filtro sipas kategorisë" })).toHaveValue(
      "transport",
    );
  }
});

test("every proposal route exposes indexable metadata and server-rendered detail", async ({
  page,
}) => {
  await page.goto(
    "/propozime/me-shume-hije-ne-stacionet-e-autobuseve--11111111-1111-4111-8111-111111111111",
  );
  await expect(page).toHaveTitle(/Më shumë hije në stacionet e autobusëve — Kuvend/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/propozime\/me-shume-hije-ne-stacionet-e-autobuseve--11111111/,
  );
  await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /Më shumë hije në stacionet e autobusëve/,
  );
  await expect(
    page
      .getByRole("article")
      .getByRole("heading", { name: "Më shumë hije në stacionet e autobusëve", level: 2 }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="public-header"]')).toBeVisible();
  await expect(page.locator('[data-slot="public-footer"]')).toBeAttached();
  const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(structuredData.join(" ")).toContain("DiscussionForumPosting");
  expect(structuredData.join(" ")).toContain("Më shumë hije në stacionet e autobusëve");
});

test("trust and transparency pages are indexable, connected and mobile-safe", async ({
  page,
}, testInfo) => {
  const routes = [
    ["/besimi", "Qendra e besimit"],
    ["/rreth-kuvendit", "Kush qëndron pas Kuvend"],
    ["/si-funksionon", "Si funksionon"],
    ["/privatesia", "Privatësia"],
    ["/siguria", "Siguria"],
    ["/financimi", "Financimi"],
    ["/transparenca", "Transparenca"],
  ] as const;

  for (const [path, heading] of routes) {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`${path}$`),
    );
    await expect(page.locator('[data-slot="public-header"]')).toBeVisible();
    await expect(page.locator('[data-slot="public-footer"]')).toBeVisible();
    await expect(
      page.locator('[data-slot="public-header"] nav[aria-label="Kryesor"] a[href="/besimi"]'),
    ).toBeAttached();
    await expect(page.getByRole("navigation", { name: "Besimi" })).toBeAttached();
    expect(await page.locator("body").evaluate((body) => body.scrollWidth > body.clientWidth)).toBe(
      false,
    );
  }

  await page.goto("/besimi");
  await expect(page.getByText("Statusi aktual: beta sintetike")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Kush merr çfarë?" })).toBeVisible();
  await expect(
    page.locator(".trust-directory").getByRole("link", { name: /Kush qëndron pas Kuvend/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Siguria dhe raportimi/ })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")),
  ).toEqual([]);
  if ((testInfo.project.use.viewport?.width ?? 1000) < 640) {
    const smallTargets = await page.locator("a:visible,button:visible").evaluateAll((elements) =>
      elements
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        })
        .map((element) => element.textContent?.trim()),
    );
    expect(smallTargets).toEqual([]);
  }
  if ((testInfo.project.use.viewport?.width ?? 1000) <= 412) {
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    expect(await page.locator("body").evaluate((body) => body.scrollWidth > body.clientWidth)).toBe(
      false,
    );
  }
});

test("desktop navigation is centered, understated and marks the active page", async ({
  page,
}, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 0) < 1024);
  await page.goto("/");
  const header = page.locator('[data-slot="public-header"]');
  const navigation = header.getByRole("navigation", { name: "Kryesor" });
  const geometry = await navigation.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    return { center: bounds.left + bounds.width / 2, viewportCenter: window.innerWidth / 2 };
  });
  expect(Math.abs(geometry.center - geometry.viewportCenter)).toBeLessThanOrEqual(1);
  expect(await header.evaluate((element) => getComputedStyle(element).boxShadow)).toBe("none");
  await navigation.getByRole("link", { name: "Si funksionon" }).click();
  await expect(page).toHaveURL(/\/si-funksionon$/);
  await expect(
    page.getByRole("navigation", { name: "Kryesor" }).getByRole("link", { name: "Si funksionon" }),
  ).toHaveAttribute("aria-current", "page");
  const notification = page.getByRole("link", { name: "Njoftimet", exact: true });
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

test("desktop vote and research actions remain fully visible at 1380px", async ({
  page,
}, testInfo) => {
  test.skip((testInfo.project.use.viewport?.width ?? 0) < 1180);
  await page.setViewportSize({ width: 1380, height: 1555 });
  await page.goto("/#propozimet");
  const voteBox = page.locator(".vote-box");
  await expect(voteBox.getByRole("button", { name: "Mbështes" })).toBeVisible();
  await expect(voteBox.getByRole("button", { name: "Kundërshtoj" })).toBeVisible();
  const voteGeometry = await voteBox.evaluate((panel) => {
    const bounds = panel.getBoundingClientRect();
    return {
      contentOverflow: panel.scrollWidth > panel.clientWidth,
      clippedActions: [...panel.querySelectorAll("button,a")]
        .map((element) => {
          const box = element.getBoundingClientRect();
          return {
            label: element.textContent?.trim(),
            clipped: box.left < bounds.left || box.right > bounds.right,
          };
        })
        .filter((item) => item.clipped),
    };
  });
  expect(voteGeometry.contentOverflow).toBe(false);
  expect(voteGeometry.clippedActions).toEqual([]);
  const research = page.getByRole("button", { name: "Hulumto me AI ose Google" });
  await expect(research).toBeVisible();
  await research.click();
  await expect(page.getByRole("button", { name: /Pyet ChatGPT/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Pyet Claude/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Kërko në Google/ })).toBeVisible();
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
