import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/v1/proposals", async (route) => {
    if (route.request().method() === "GET") return route.abort();
    const draft = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        proposal: {
          ...draft,
          id: "44444444-4444-4444-8444-444444444444",
          summary: String(draft.problem).slice(0, 120),
          pseudonym: "Shqiponja e Qetë",
          status: "pending_review",
          revisionNumber: 1,
          arguments: [],
          statusHistory: [
            {
              status: "pending_review",
              at: "2026-08-03T10:00:00.000Z",
              note: "U dërgua për shqyrtim.",
            },
          ],
        },
      }),
    });
  });
  await page.route("**/v1/otp/start", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ challengeId: "mobile-challenge", otpProvider: "synthetic" }),
    }),
  );
  await page.route("**/v1/otp/check", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ credential: "mobile-synthetic-credential" }),
    }),
  );
});

function mobileOnly(width: number | undefined) {
  test.skip((width ?? 1000) >= 768);
}

async function completeOtp(page: Page) {
  await expect(page.getByRole("heading", { name: "Verifiko telefonin" })).toBeVisible();
  await page.getByRole("button", { name: "Dërgo kodin" }).click();
  await page.getByLabel("Kodi gjashtëshifror").fill("123456");
  await page.getByRole("button", { name: "Verifiko dhe vazhdo" }).click();
}

async function expectMobileSheet(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const geometry = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      bottomGap: Math.abs(window.innerHeight - rect.bottom),
      leftGap: Math.abs(rect.left),
      widthGap: Math.abs(window.innerWidth - rect.width),
    };
  });
  expect(geometry.bottomGap).toBeLessThanOrEqual(1);
  expect(geometry.leftGap).toBeLessThanOrEqual(1);
  expect(geometry.widthGap).toBeLessThanOrEqual(1);
  const undersizedButtons = await dialog.locator("button:visible").evaluateAll((buttons) =>
    buttons
      .filter((button) => {
        const rect = button.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      })
      .map((button) => button.textContent?.trim() || button.getAttribute("aria-label")),
  );
  expect(undersizedButtons).toEqual([]);
}

test("mobile detail respects browser back and overlays use the bottom edge", async ({
  page,
}, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await expect(page).toHaveURL(/\/propozime\//);
  await expect(page.locator(".proposal-detail")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".proposal-list")).toBeVisible();
  await expect(page.locator(".proposal-detail")).toBeHidden();

  await page.getByRole("button", { name: "Propozo" }).click();
  await expect(page.getByRole("heading", { name: "Jepi një titull" })).toBeVisible();
  await expectMobileSheet(page);
});

test("mobile vote completes OTP, final confirmation, result and receipt", async ({
  page,
}, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  let ballotPayload: Record<string, unknown> | undefined;
  await page.route("**/v1/ballots", async (route) => {
    ballotPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        receipt: "mobile-inclusion-receipt",
        result: { support: 429, oppose: 100, turnout: 529 },
      }),
    });
  });

  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await page.getByRole("button", { name: "Mbështes" }).click();
  await expectMobileSheet(page);
  await completeOtp(page);

  const confirm = page.getByRole("button", { name: "Konfirmo votën përfundimtare" });
  await expect(confirm).toBeVisible();
  await confirm.click();
  await expect(page.getByRole("heading", { name: "Vota u përfshi" })).toBeVisible();
  await expect(page.getByText("mobile-inclusion-receipt")).toBeVisible();
  expect(ballotPayload).toMatchObject({
    choice: "support",
    credential: "mobile-synthetic-credential",
  });
  expect(JSON.stringify(ballotPayload)).not.toMatch(/phone|\+355/);
});

test("mobile proposal wizard can skip AI, verify, submit and show recovery secret", async ({
  page,
}, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  await page.goto("/");
  await page.getByRole("button", { name: "Propozo" }).click();

  await page.getByLabel("Çfarë dëshiron të ndryshojë?").fill("Më shumë pemë në lagje");
  await page.getByRole("button", { name: /Vazhdo/ }).click();
  await page
    .getByLabel("Cili është problemi sot?")
    .fill("Lagjet e dendura kanë shumë pak hije dhe hapësira të gjelbra për banorët.");
  await page.getByRole("button", { name: /Vazhdo/ }).click();
  await page
    .getByLabel("Çfarë duhet të ndryshojë?")
    .fill("Bashkitë të mbjellin pemë vendase dhe të publikojnë planin vjetor të mirëmbajtjes.");
  await page.getByRole("button", { name: /Vazhdo/ }).click();

  await expect(page.getByRole("group", { name: "Prova dhe media Opsionale" })).toHaveCount(1);
  await page.getByRole("button", { name: /Shto provë ose media/ }).click();
  await expect(page.getByRole("heading", { name: "Shto provë ose media" })).toBeVisible();
  await page.getByLabel("Titulli").fill("Plani vendor i gjelbërimit");
  await page.getByLabel("Lidhja HTTPS").fill("https://example.org/plani-gjelberimit");
  await page.getByRole("button", { name: "Shto materialin" }).click();
  await expect(page.getByRole("link", { name: "Plani vendor i gjelbërimit" })).toBeVisible();
  await page.getByRole("button", { name: "Pa ndihmë AI" }).click();
  await expect(page.getByRole("heading", { name: "Konfirmo propozimin" })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Konfirmo dhe dorëzo" }).click();

  await completeOtp(page);
  await expect(page.getByRole("heading", { name: "Konfirmo propozimin" })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Konfirmo dhe dorëzo" }).click();
  await expect(page.getByRole("heading", { name: "Ruaj sekretin e rikuperimit" })).toBeVisible();
  await expect(page.getByText("Kuvend nuk mund ta gjejë përmes telefonit.")).toBeVisible();
});

test("mobile argument keeps its evidence across OTP and publishes without identity data", async ({
  page,
}, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  let argumentPayload: Record<string, unknown> | undefined;
  await page.route("**/v1/arguments", async (route) => {
    argumentPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        argument: {
          id: "argument-mobile",
          ...argumentPayload,
          pseudonym: "Lumi i Hapur",
          createdAt: "2026-08-03T10:00:00.000Z",
        },
      }),
    });
  });

  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await page.getByRole("button", { name: "Shto argument" }).click();
  await expectMobileSheet(page);
  await page.getByRole("button", { name: "Kundër" }).click();
  await page
    .getByLabel("Argumenti")
    .fill("Mirëmbajtja duhet të ketë një buxhet dhe përgjegjës publik të përcaktuar.");
  await expect(page.getByText("Po publikon si")).toBeVisible();
  await expect(page.getByText("Pseudonim i rastësishëm")).toBeVisible();
  await page.getByRole("button", { name: /Shto provë ose media/ }).click();
  await page.getByLabel("Lloji").selectOption("image");
  await page.getByRole("button", { name: "Ngarko skedar" }).click();
  await page.getByLabel("Skedari").setInputFiles({
    name: "stacioni.png",
    mimeType: "image/png",
    buffer: Buffer.from("pamje-test"),
  });
  await expect(page.getByAltText("Pamje paraprake e stacioni.png")).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Përparimi i stacioni.png" })).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  await page.getByRole("button", { name: "Lidhje" }).click();
  await page.getByLabel("Lloji").selectOption("source");
  await page.getByLabel("Titulli").fill("Rregullorja e mirëmbajtjes");
  await page.getByLabel("Lidhja HTTPS").fill("https://example.org/rregullorja");
  await page.getByRole("button", { name: "Shto materialin" }).click();
  await page.getByRole("button", { name: "Ndrysho" }).click();
  await page.getByRole("button", { name: "Me emrin tim" }).click();
  await page.getByLabel("Emri që dëshiron të shfaqet").fill("Arta Testuese");
  await page.getByRole("button", { name: "Publiko argumentin" }).click();

  await completeOtp(page);
  await expect(page.getByRole("heading", { name: "Shto një argument" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Rregullorja e mirëmbajtjes" })).toBeVisible();
  await expect(page.getByText("Po publikon si")).toBeVisible();
  await expect(page.getByText("Arta Testuese")).toBeVisible();
  await page.getByRole("button", { name: "Publiko argumentin" }).click();
  await expect(page.getByText("Arta Testuese")).toBeVisible();
  expect(argumentPayload).toMatchObject({
    position: "against",
    credential: "mobile-synthetic-credential",
    publicAuthorName: "Arta Testuese",
    evidence: [
      {
        type: "source",
        title: "Rregullorja e mirëmbajtjes",
        url: "https://example.org/rregullorja",
      },
    ],
  });
  expect(JSON.stringify(argumentPayload)).not.toMatch(/phone|\+355/);
  expect(consoleErrors.filter((message) => message.includes("controlled input"))).toEqual([]);
});

test("mobile notifications and privacy details remain optional and identity-free", async ({
  page,
}, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  await page.goto("/");
  await page.getByRole("button", { name: "Hap menunë" }).click();
  await page
    .getByRole("navigation", { name: "Menuja celulare" })
    .getByRole("button", { name: "Njoftimet" })
    .click();
  await expectMobileSheet(page);
  await expect(page.getByText("Pa profil anëtari")).toBeVisible();
  await expect(page.getByRole("link", { name: "RSS-in publik" })).toHaveAttribute(
    "href",
    "/feed.xml",
  );
  await page.getByRole("checkbox", { name: "Transport" }).check();
  const topicTargetHeight = await page
    .getByRole("checkbox", { name: "Transport" })
    .locator("xpath=ancestor::label")
    .evaluate((label) => label.getBoundingClientRect().height);
  expect(topicTargetHeight).toBeGreaterThanOrEqual(44);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    // Base UI adds visually hidden Safari focus sentinels with a button role.
    // They are inert focus-loop infrastructure, not user-facing controls.
    .exclude("[data-base-ui-focus-guard]")
    .analyze();
  expect(
    results.violations.filter((item) => ["serious", "critical"].includes(item.impact ?? "")),
  ).toEqual([]);

  await page.getByRole("button", { name: "Mbyll" }).click();
  await page.getByRole("link", { name: "Si mbrohet privatësia" }).click();
  await expect(page).toHaveURL(/\/privatesia#si-mbrohet-vota$/);
  await expect(page.getByRole("heading", { name: "Si mbrohet vota pa emër" })).toBeVisible();
});

test("mobile section navigation honors reduced motion", async ({ page }, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Hap menunë" }).click();
  await page
    .getByRole("navigation", { name: "Menuja celulare" })
    .getByRole("link", { name: "Si funksionon" })
    .click();
  await expect(page).toHaveURL(/#si-funksionon$/);
  await expect(page.getByRole("heading", { name: "Nga ideja te përgjigjja" })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("long proposal history starts compact and can reveal every event", async ({
  page,
}, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  const timelineItems = page.locator(".status-timeline li");
  await expect(timelineItems).toHaveCount(4);
  await page.getByRole("button", { name: "Shfaq edhe 2 ngjarje" }).click();
  await expect(timelineItems).toHaveCount(6);
  await expect(page.getByRole("button", { name: "Shfaq vetëm ngjarjet e fundit" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});
