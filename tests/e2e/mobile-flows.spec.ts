import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { Group } from "@semaphore-protocol/group";
import { Identity } from "@semaphore-protocol/identity";

function membershipSnapshot(identityCommitment: string) {
  const members = [
    identityCommitment,
    new Identity().commitment.toString(),
    new Identity().commitment.toString(),
  ].sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1));
  const group = new Group(members.map(BigInt));
  return {
    protocol: "semaphore-v4",
    epoch: "e2e",
    members,
    root: group.root.toString(),
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    signature: "a".repeat(64),
  };
}

const testProposals = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Më shumë hije në stacionet e autobusëve",
    summary: "Stacionet pa hije i ekspozojnë udhëtarët ndaj vapës së verës.",
    problem: "Shumë stacione autobusi nuk kanë strehë ose hije për udhëtarët.",
    proposedChange: "Bashkitë të vendosin strehë, hije dhe ulëse në stacionet më të përdorura.",
    scope: "national",
    category: "transport",
    evidence: [],
    pseudonym: "Lisi i Qetë",
    status: "voting_open",
    revisionNumber: 1,
    votingRound: {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      opensAt: "2026-08-01T09:00:00.000Z",
      closesAt: "2026-08-15T09:00:00.000Z",
      turnout: 0,
    },
    arguments: [
      {
        id: "a1",
        position: "for",
        body: "E bën transportin më njerëzor.",
        evidence: [],
        pseudonym: "Ura e Hapur",
        createdAt: "2026-08-02T10:00:00.000Z",
      },
      {
        id: "a2",
        position: "against",
        body: "Duhet qartësuar mirëmbajtja.",
        evidence: [],
        pseudonym: "Guri i Bardhë",
        createdAt: "2026-08-03T10:00:00.000Z",
      },
      {
        id: "a3",
        position: "for",
        body: "Ndihmon të moshuarit dhe fëmijët.",
        evidence: [],
        pseudonym: "Bredhi i Gjelbër",
        createdAt: "2026-08-04T10:00:00.000Z",
      },
      {
        id: "a4",
        position: "against",
        body: "Duhet publikuar kostoja.",
        evidence: [],
        pseudonym: "Mali i Hapur",
        createdAt: "2026-08-05T10:00:00.000Z",
      },
    ],
    statusHistory: [
      { status: "pending_review", at: "2026-07-27T09:00:00.000Z", note: "U dorëzua." },
      {
        status: "pending_review",
        at: "2026-07-28T09:00:00.000Z",
        note: "U kontrollua privatësia.",
      },
      {
        status: "pending_review",
        at: "2026-07-29T09:00:00.000Z",
        note: "U kontrollua fusha.",
      },
      {
        status: "pending_review",
        at: "2026-07-30T09:00:00.000Z",
        note: "U përmirësua versioni.",
      },
      {
        status: "pending_review",
        at: "2026-07-31T09:00:00.000Z",
        note: "U konfirmua vendimi.",
      },
      { status: "voting_open", at: "2026-08-01T09:00:00.000Z", note: "Kaloi moderimin." },
    ],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    title: "Kontratat publike në format të hapur",
    summary: "Kontratat duhet të jenë të kërkueshme dhe të ripërdorshme.",
    problem: "Dokumentet publike nuk kërkohen lehtë.",
    proposedChange: "Kontratat të publikohen si të dhëna të strukturuara.",
    scope: "national",
    category: "governance",
    evidence: [],
    pseudonym: "Fjala e Lirë",
    status: "voting_closed",
    revisionNumber: 1,
    votingRound: {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      opensAt: "2026-07-01T09:00:00.000Z",
      closesAt: "2026-07-15T09:00:00.000Z",
      turnout: 312,
    },
    closedResult: {
      turnout: 312,
      support: 240,
      oppose: 72,
      closedAt: "2026-07-15T09:00:00.000Z",
    },
    arguments: [],
    statusHistory: [
      { status: "voting_closed", at: "2026-07-15T09:00:00.000Z", note: "Votimi u mbyll." },
    ],
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    title: "Kalime më të sigurta pranë shkollave",
    summary: "Sinjalistikë dhe ndriçim më i mirë në zonat me fëmijë.",
    problem: "Hyrjet e shkollave nuk kanë kalime të dukshme.",
    proposedChange: "Auditim sigurie dhe ndërhyrje pranë çdo shkolle.",
    scope: "national",
    category: "community",
    evidence: [],
    pseudonym: "Drita e Mëngjesit",
    status: "voting_open",
    revisionNumber: 1,
    votingRound: {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      opensAt: "2026-08-01T09:00:00.000Z",
      closesAt: "2026-08-15T09:00:00.000Z",
      turnout: 0,
    },
    arguments: [],
    statusHistory: [
      { status: "voting_open", at: "2026-08-01T09:00:00.000Z", note: "Kaloi moderimin." },
    ],
  },
];

test.beforeEach(async ({ page }) => {
  let identityCommitment = "";
  await page.route("**/health", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        otpProvider: "sentdm",
        credentialProtocol: "semaphore-v4",
        participationOpen: true,
      }),
    }),
  );
  await page.route("**/v1/proposals", async (route) => {
    if (route.request().method() === "GET")
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ proposals: testProposals }),
      });
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
  await page.route("**/v1/otp/start", (route) => {
    identityCommitment = String(route.request().postDataJSON().identityCommitment);
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ challengeId: "mobile-challenge", otpProvider: "sentdm" }),
    });
  });
  await page.route("**/v1/otp/check", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        credentialProtocol: "semaphore-v4",
        snapshot: membershipSnapshot(identityCommitment),
        membershipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60_000).toISOString(),
      }),
    }),
  );
});

test("production fails closed and discards a stale credential when verification is unavailable", async ({
  page,
}) => {
  let ballotRequests = 0;
  await page.route("**/health", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        otpProvider: "sentdm",
        participationOpen: false,
      }),
    }),
  );
  await page.route("**/v1/ballots", async (route) => {
    ballotRequests += 1;
    await route.fulfill({
      status: 503,
      body: JSON.stringify({ error: "participation_not_available" }),
    });
  });
  await page.addInitScript(() => {
    localStorage.setItem("kuvend.credential.v2", JSON.stringify({ protocol: "semaphore-v4" }));
  });

  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await expect(page.getByText("Votimi është përkohësisht i pezulluar")).toBeVisible();
  await expect(page.getByRole("button", { name: "Mbështes" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Kundërshtoj" })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem("kuvend.credential.v2"))).toBeNull();
  expect(ballotRequests).toBe(0);
});

function mobileOnly(width: number | undefined) {
  test.skip((width ?? 1000) >= 768);
}

async function completeOtp(page: Page) {
  await expect(page.getByRole("heading", { name: "Verifiko numrin" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Shteti dhe kodi telefonik" })).toHaveValue(
    "🇦🇱 Shqipëri (+355)",
  );
  await page.getByLabel("Numri i telefonit").fill("069 123 4567");
  await page.getByRole("button", { name: "Dërgo kodin në WhatsApp" }).click();
  await expect(page.getByText("Kontrollo WhatsApp")).toBeVisible();
  await page.getByLabel("Kodi gjashtëshifror").fill("123456");
  await page.getByRole("button", { name: "Verifiko dhe vazhdo" }).click();
}

test("WhatsApp failure offers an explicit SMS fallback", async ({ page }, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  const deliveryChannels: string[] = [];
  await page.route("**/v1/otp/start", async (route) => {
    const payload = route.request().postDataJSON() as { deliveryChannel?: string };
    deliveryChannels.push(payload.deliveryChannel ?? "whatsapp");
    if (payload.deliveryChannel === "sms") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          challengeId: "sms-challenge",
          otpProvider: "sentdm",
          deliveryChannel: "sms",
        }),
      });
    }
    return route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error: "verification_unavailable" }),
    });
  });

  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await page.getByRole("button", { name: "Mbështes" }).click();
  await page.getByLabel(/Numri i telefonit/).fill("069 123 4567");
  await page.getByRole("button", { name: "Dërgo kodin në WhatsApp" }).click();
  await expect(page.getByText("Kodi nuk mund të dërgohej në WhatsApp")).toBeVisible();
  await page.getByRole("button", { name: "Dërgo kodin me SMS" }).click();
  await expect(page.getByText("Kontrollo mesazhet SMS")).toBeVisible();
  expect(deliveryChannels).toEqual(["whatsapp", "sms"]);
});

test("OTP outage is identified as a service problem rather than an invalid phone", async ({
  page,
}) => {
  await page.route("**/v1/otp/start", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "verification_not_available" }),
    }),
  );

  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await page.getByRole("button", { name: "Mbështes" }).click();
  await page.getByLabel("Numri i telefonit").fill("069 123 4567");
  await page.getByRole("button", { name: "Dërgo kodin në WhatsApp" }).click();

  await expect(
    page.getByText(
      "Shërbimi i verifikimit është përkohësisht i padisponueshëm. Numri yt nuk është problemi; provo përsëri pas pak.",
    ),
  ).toBeVisible();
});

test("OTP delivery rejection keeps the selected country and allows correction", async ({
  page,
}) => {
  let attempts = 0;
  await page.route("**/v1/otp/start", (route) => {
    attempts += 1;
    return attempts === 1
      ? route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ error: "verification_unavailable" }),
        })
      : route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ challengeId: "corrected-number", otpProvider: "sentdm" }),
        });
  });

  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await page.getByRole("button", { name: "Mbështes" }).click();
  const country = page.getByRole("combobox", { name: "Shteti dhe kodi telefonik" });
  await page.getByRole("button", { name: "Kërko ose ndrysho shtetin" }).click();
  await country.fill("Bashkuara");
  await page.getByRole("option", { name: /Shtetet e Bashkuara.*\+1/ }).click();
  await page.getByLabel("Numri i telefonit").fill("202 555 0147");
  await page.getByRole("button", { name: "Dërgo kodin në WhatsApp" }).click();

  await expect(page.getByText(/Kodi nuk mund të dërgohej në WhatsApp/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Dërgo kodin me SMS" })).toBeVisible();
  await expect(country).toHaveValue(/Shtetet e Bashkuara.*\(\+1\)/);
  await page.getByLabel("Numri i telefonit").fill("202 555 0188");
  await page.getByRole("button", { name: "Dërgo kodin në WhatsApp" }).click();

  await expect(page.getByText("Kontrollo WhatsApp")).toBeVisible();
  expect(attempts).toBe(2);
});

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

test("proposal research waits for consent and opens only public provider actions", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    const state = window as typeof window & {
      __externalResearch?: { urls: string[]; prompt: string };
    };
    state.__externalResearch = { urls: [], prompt: "" };
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          state.__externalResearch!.prompt = value;
        },
      },
    });
    HTMLAnchorElement.prototype.click = function click() {
      state.__externalResearch!.urls.push(this.href);
    };
  });
  await page.goto("/");
  await page.locator(".proposal-card").first().click();

  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __externalResearch?: { urls: string[] } }).__externalResearch
          ?.urls.length,
    ),
  ).toBe(0);

  await page.getByRole("button", { name: "Hulumto me AI ose Google" }).click();
  await expect(page.getByText(/Ai mund të shohë adresën tënde IP/)).toBeVisible();
  if ((testInfo.project.use.viewport?.width ?? 1000) < 640) await expectMobileSheet(page);
  await page.getByRole("button", { name: /Pyet ChatGPT/ }).click();

  const chatGptState = await page.evaluate(
    () =>
      (
        window as typeof window & {
          __externalResearch?: { urls: string[]; prompt: string };
        }
      ).__externalResearch,
  );
  expect(chatGptState?.urls).toHaveLength(1);
  const chatGptUrl = new URL(chatGptState?.urls[0] ?? "about:blank");
  expect(chatGptUrl.origin).toBe("https://chatgpt.com");
  expect(chatGptUrl.searchParams.get("q")).toContain("Mos e trajto asnjë pretendim si fakt");
  expect(chatGptUrl.searchParams.get("q")).toContain("/propozime/me-shume-hije");
  expect(chatGptState?.prompt).toContain("Mos e trajto asnjë pretendim si fakt");
  expect(chatGptState?.prompt).toContain("/propozime/me-shume-hije");
  expect(chatGptState?.prompt).not.toMatch(/phone|otp|credential|receipt|nullifier/i);

  await page.getByRole("button", { name: "Hulumto me AI ose Google" }).click();
  await page.getByRole("button", { name: /Kërko në Google/ }).click();
  const urls = await page.evaluate(
    () =>
      (window as typeof window & { __externalResearch?: { urls: string[] } }).__externalResearch
        ?.urls,
  );
  expect(urls?.[1]).toMatch(/^https:\/\/www\.google\.com\/search\?q=/);
  expect(decodeURIComponent(urls?.[1] ?? "")).toContain("Më shumë hije");
});

test("direct research link remains complete when clipboard access fails", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as typeof window & { __researchUrl?: string };
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => Promise.reject(new Error("blocked")) },
    });
    HTMLAnchorElement.prototype.click = function click() {
      state.__researchUrl = this.href;
    };
  });
  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await page.getByRole("button", { name: "Hulumto me AI ose Google" }).click();
  await page.getByRole("button", { name: /Pyet Claude/ }).click();
  const directUrl = await page.evaluate(
    () => (window as typeof window & { __researchUrl?: string }).__researchUrl,
  );
  const claudeUrl = new URL(directUrl ?? "about:blank");
  expect(claudeUrl.origin).toBe("https://claude.ai");
  expect(claudeUrl.searchParams.get("q")).toContain("Më shumë hije në stacionet e autobusëve");
});

test("mobile vote completes OTP, final confirmation, result and receipt", async ({
  page,
}, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  let ballotPayload: Record<string, unknown> | undefined;
  let otpStartPayload: Record<string, unknown> | undefined;
  await page.route("**/v1/otp/start", async (route) => {
    otpStartPayload = route.request().postDataJSON() as Record<string, unknown>;
    await route.fallback();
  });
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
  await expect(page.getByText("Kufiri i privatësisë")).toBeVisible();
  await expect(page.getByText("OTP provon vetëm kontrollin e numrit.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Lexo shpjegimin e plotë" })).toHaveAttribute(
    "href",
    "/privatesia#si-mbrohet-vota",
  );
  await completeOtp(page);

  const confirm = page.getByRole("button", { name: "Konfirmo votën përfundimtare" });
  await expect(confirm).toBeVisible();
  await expect(page.getByText("Gati për konfirmim")).toBeVisible();
  await expect(page.getByText(/Numri yt nuk dërgohet me votën/)).toBeVisible();
  await confirm.click();
  await expect(page.getByRole("heading", { name: "Vota u përfshi" })).toBeVisible();
  await expect(page.getByText("mobile-inclusion-receipt")).toBeVisible();
  await expect(page.getByText(/Mandati kontrollon përfshirjen/)).toBeVisible();
  expect(ballotPayload).toMatchObject({
    choice: "support",
    credentialProof: { protocol: "semaphore-v4" },
  });
  expect(JSON.stringify(ballotPayload)).not.toMatch(/phone|\+355/);
  expect(otpStartPayload).toMatchObject({ phone: "+355691234567" });
  expect(String(otpStartPayload?.identityCommitment)).toMatch(/^\d+$/);
});

test("country hint is ephemeral and the full country list is searchable", async ({ page }) => {
  let countryRequest: { method: string; postData: string | null } | undefined;
  await page.route("**/api/country", async (route) => {
    countryRequest = {
      method: route.request().method(),
      postData: route.request().postData(),
    };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "cache-control": "private, no-store, max-age=0" },
      body: JSON.stringify({ country: "IT" }),
    });
  });
  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await page.getByRole("button", { name: "Mbështes" }).click();
  const country = page.getByRole("combobox", { name: "Shteti dhe kodi telefonik" });
  await expect(country).toHaveValue("🇮🇹 Itali (+39)");
  await country.fill("Shqip");
  const albania = page.getByRole("option", { name: "Shqipëri +355" });
  await expect(albania).toBeVisible();
  await expect(albania).toHaveText(/Shqipëri.*\+355/);
  await albania.click();
  await expect(country).toHaveValue("🇦🇱 Shqipëri (+355)");
  expect(countryRequest).toEqual({ method: "GET", postData: null });
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
  await expect(
    page.getByRole("button", { name: "Kontrollo gramatikën dhe drejtshkrimin me IA" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Shto provë ose media/ }).click();
  await expect(page.getByRole("heading", { name: "Shto provë ose media" })).toBeVisible();
  await page.getByLabel("Titulli").fill("Plani vendor i gjelbërimit");
  await page.getByLabel("Lidhja HTTPS").fill("https://example.org/plani-gjelberimit");
  await page.getByRole("button", { name: "Shto materialin" }).click();
  await expect(page.getByRole("link", { name: "Plani vendor i gjelbërimit" })).toBeVisible();
  await page.getByRole("button", { name: "Pa ndihmë AI" }).click();
  await expect(page.getByRole("heading", { name: "Konfirmo propozimin" })).toBeVisible();
  await expect(page.getByText("Kontrollo versionin përfundimtar")).toBeVisible();
  const finalReview = page.locator(".final-review");
  await expect(finalReview.getByText("Ndryshimi i propozuar", { exact: true })).toBeVisible();
  await expect(finalReview.locator("section")).toHaveCount(6);
  const finalReviewGeometry = await finalReview.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { left: rect.left, right: rect.right, viewport: window.innerWidth };
  });
  expect(finalReviewGeometry.left).toBeGreaterThanOrEqual(0);
  expect(finalReviewGeometry.right).toBeLessThanOrEqual(finalReviewGeometry.viewport);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Konfirmo dhe dorëzo" }).click();

  await expect(page.getByText("Puna jote është ruajtur në këtë pajisje")).toBeVisible();
  await expect(page.getByRole("button", { name: "Kthehu te propozimi" })).toBeVisible();
  await page.getByRole("button", { name: "Kthehu te propozimi" }).click();
  await expect(page.getByRole("heading", { name: "Konfirmo propozimin" })).toBeVisible();
  await expect(page.getByText("Më shumë pemë në lagje", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Propozo" }).click();
  await expect(page.getByRole("heading", { name: "Konfirmo propozimin" })).toBeVisible();
  await expect(page.getByText("Më shumë pemë në lagje", { exact: true })).toBeVisible();
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
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      "base64",
    ),
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
  await expect.poll(() => argumentPayload).toBeDefined();
  expect(argumentPayload).toMatchObject({
    position: "against",
    credentialProof: { protocol: "semaphore-v4" },
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
  await page.getByRole("button", { name: "Njoftimet", exact: true }).click();
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

test("mobile navigation uses the same destinations and marks the active page", async ({
  page,
}, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Hap menunë" }).click();
  let mobileNavigation = page.getByRole("navigation", { name: "Menuja celulare" });
  await expect(mobileNavigation).toBeVisible();
  await mobileNavigation.getByRole("link", { name: "Si funksionon" }).click();
  await expect(page).toHaveURL(/\/si-funksionon$/);
  await expect(page.getByRole("heading", { name: "Si funksionon", level: 1 })).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Hap menunë" }).click();
  mobileNavigation = page.getByRole("navigation", { name: "Menuja celulare" });
  await expect(mobileNavigation).toBeVisible();
  await expect(mobileNavigation.getByRole("link", { name: "Si funksionon" })).toHaveAttribute(
    "aria-current",
    "page",
  );
});

test("header actions from detail pages open the matching home flow", async ({ page }, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  await page.goto("/besimi");
  await page.getByRole("link", { name: "Propozo" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Jepi një titull" })).toBeVisible();
  await page.getByRole("button", { name: "Mbyll" }).click();
  await page.goto("/besimi");
  await page.getByRole("link", { name: "Njoftimet" }).click();
  await expect(page.getByText("Pa profil anëtari")).toBeVisible();
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

test("vote steps open in place and return focus to the proposal", async ({ page }, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  const originalUrl = page.url();
  const stepsButton = page.getByRole("button", { name: "Hapat" });
  await stepsButton.click();
  await expect(page.getByRole("heading", { name: "Si funksionon vota" })).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("listitem")).toHaveCount(5);
  expect(page.url()).toBe(originalUrl);
  await page.getByRole("button", { name: "E kuptova" }).click();
  await expect(stepsButton).toBeFocused();
});

test("arguments stay balanced and the full list opens on demand", async ({ page }, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  await page.goto("/");
  await page.locator(".proposal-card").first().click();
  await expect(page.getByRole("heading", { name: "Argumentet" })).toBeVisible();
  await expect(page.locator(".argument-preview-grid .argument-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Shiko të gjitha 4 argumentet" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Të gjitha argumentet" })).toBeVisible();
  await expect(dialog.locator(".argument-card")).toHaveCount(4);
  await expectMobileSheet(page);
});

test("closed proposals have a visible URL-backed filter and public result", async ({
  page,
}, testInfo) => {
  mobileOnly(testInfo.project.use.viewport?.width);
  await page.goto("/");
  await page.evaluate(() => document.getElementById("propozimet")?.scrollIntoView());
  await expect(page.getByRole("group", { name: "Statuset kryesore" })).toBeVisible();
  await page
    .getByRole("group", { name: "Statuset kryesore" })
    .getByRole("button", { name: "Mbyllur", exact: true })
    .click();
  await expect(page).toHaveURL(/status=voting_closed/);
  await expect(page.locator(".proposal-card")).toHaveCount(1);
  await page.locator(".proposal-card").click();
  await expect(page.getByText("77% mbështesin")).toBeVisible();
  await expect(page.getByRole("article").getByText("312 pjesëmarrës")).toBeVisible();
});

test("process summary uses icons and links to the complete explanation", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".step-marker svg")).toHaveCount(4);
  await expect(page.getByRole("link", { name: /Shiko shpjegimin e plotë/ })).toHaveAttribute(
    "href",
    "/si-funksionon",
  );
});
