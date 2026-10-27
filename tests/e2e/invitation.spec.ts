import { expect, test, type Page } from "@playwright/test";

// An empty, proportioned test surface only. No replacement wedding artwork is saved.
const testSurface = '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1414"><rect width="1000" height="1414" fill="white"/></svg>';

async function provideTestSurface(page: Page) {
  await page.route("**/images/wedding-invitation.png", (route) => route.fulfill({ contentType: "image/svg+xml", body: testSurface }));
}

async function expectOpen(page: Page) {
  await expect(page.getByRole("link", { name: "Get directions" })).toBeVisible();
  await expect(page.locator(".revealing-card")).toHaveCSS("opacity", "1");
}

test("welcome page is mobile-safe and opens a generic preview", async ({ page }) => {
  await provideTestSurface(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dulmi & Isuru" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: test.info().outputPath("welcome.png"), fullPage: true });
  await page.getByRole("link", { name: "Open the invitation" }).click();
  await page.getByRole("button", { name: "Skip animation" }).click();
  await expectOpen(page);
  await expect(page.getByTestId("guest-name")).toHaveText("Dear family & friends");
});

test("first visit runs the slow envelope sequence, then supports replay and session persistence", async ({ page }) => {
  await provideTestSurface(page);
  await page.goto("/invite/perera-family");
  await expect(page.locator(".phase-playing")).toBeVisible();
  await expect(page.locator(".envelope")).toBeVisible();
  await expect(page.locator(".revealing-card")).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("link", { name: "Get directions" })).toHaveCount(0);
  await expectOpen(page);
  await expect(page.getByTestId("guest-name")).toHaveText("Mr. & Mrs. Perera");
  await page.reload();
  await expectOpen(page);
  await expect(page.locator(".envelope")).toHaveCount(0);
  await page.getByRole("button", { name: "Replay envelope" }).click();
  await expect(page.locator(".phase-playing")).toBeVisible();
  await page.getByRole("button", { name: "Skip animation" }).click();
  await expectOpen(page);
});

test("the real card emerges between the envelope layers and settles without a layout jump", async ({ page }) => {
  await page.goto("/invite/perera-family");
  await expect(page.locator(".phase-playing")).toBeVisible();
  // Seek the CSS timeline deterministically while the normal completion timer remains active.
  const layers = await page.locator(".reveal-scene").evaluate((scene) => {
    for (const animation of scene.closest("main")!.getAnimations({ subtree: true })) {
      animation.pause();
      animation.currentTime = 3200;
    }
    const card = scene.querySelector<HTMLElement>(".revealing-card")!;
    const pocket = scene.querySelector<HTMLElement>(".reveal-envelope:not(.envelope-underlay):not(.envelope-hinge)")!;
    const back = scene.querySelector<HTMLElement>(".envelope-underlay")!;
    const hinge = scene.querySelector<HTMLElement>(".envelope-hinge")!;
    return {
      cardTop: card.getBoundingClientRect().top,
      pocketTop: pocket.getBoundingClientRect().top,
      cardLayer: Number(getComputedStyle(card).zIndex),
      pocketLayer: Number(getComputedStyle(pocket).zIndex),
      backLayer: Number(getComputedStyle(back).zIndex),
      hingeLayer: Number(getComputedStyle(hinge).zIndex),
    };
  });
  expect(layers.cardTop).toBeLessThan(layers.pocketTop);
  expect(layers.backLayer).toBeLessThan(layers.cardLayer);
  expect(layers.hingeLayer).toBeLessThan(layers.cardLayer);
  expect(layers.cardLayer).toBeLessThan(layers.pocketLayer);
  await page.screenshot({ path: test.info().outputPath("envelope-opening.png"), fullPage: true });
  const before = await page.locator(".reveal-scene").boundingBox();
  await expectOpen(page);
  const after = await page.locator(".reveal-scene").boundingBox();
  expect(Math.abs(before!.y - after!.y)).toBeLessThan(1);
  expect(Math.abs(before!.height - after!.height)).toBeLessThan(1);
});

test("different guests never receive each other's names or metadata", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await provideTestSurface(page);
  const second = await context.newPage();
  await provideTestSurface(second);
  await second.emulateMedia({ reducedMotion: "reduce" });
  const [firstResponse, secondResponse] = await Promise.all([page.goto("/invite/perera-family"), second.goto("/invite/silva-family")]);
  await expectOpen(page);
  await expectOpen(second);
  await expect(page.getByTestId("guest-name")).toHaveText("Mr. & Mrs. Perera");
  await expect(second.getByTestId("guest-name")).toHaveText("Mr. Silva & Family");
  expect(firstResponse?.headers()["cache-control"]).toContain("no-store");
  expect(secondResponse?.headers()["cache-control"]).toContain("no-store");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Dulmi & Isuru | Wedding Invitation");
  await expect(second.locator('meta[property="og:title"]')).toHaveAttribute("content", "Dulmi & Isuru | Wedding Invitation");
  await expect(second.getByText("Mr. & Mrs. Perera", { exact: true })).toHaveCount(0);
});

for (const [token, name] of [
  ["fernando-invitation", "Mrs. Fernando"],
  ["jayasinghe-family", "Mr. & Mrs. Jayasinghe & Family"],
  ["doctor-perera", "Dr. Perera & Family"],
  ["long-family-name", "Mr. & Mrs. Wickramasinghe-Jayawardene & Their Beloved Family"],
]) {
  test(`name is centered and contained: ${name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await provideTestSurface(page);
    await page.goto(`/invite/${token}`);
    await expectOpen(page);
    await expect(page.getByTestId("guest-name")).toHaveText(name);
    const metrics = await page.locator(".guest-name").evaluate((text) => {
      const box = text.getBoundingClientRect();
      const band = text.parentElement!.getBoundingClientRect();
      return { offset: Math.abs((box.left + box.width / 2) - (band.left + band.width / 2)), fits: text.scrollHeight <= text.clientHeight + 1 && text.scrollWidth <= text.clientWidth + 1, inBand: box.top >= band.top - 1 && box.bottom <= band.bottom + 1, pageFits: document.documentElement.scrollWidth <= innerWidth, scrollHeight: text.scrollHeight, clientHeight: text.clientHeight, scrollWidth: text.scrollWidth, clientWidth: text.clientWidth, fontSize: getComputedStyle(text).fontSize };
    });
    expect(metrics.offset).toBeLessThan(1);
    expect(metrics.fits, JSON.stringify(metrics)).toBe(true);
    expect(metrics.inBand).toBe(true);
    expect(metrics.pageFits).toBe(true);
  });
}

test("invalid and revoked tokens have a graceful private 404", async ({ page }) => {
  for (const token of ["bad", "revoked-invitation", "unknown-invitation"]) {
    await page.goto(`/invite/${token}`);
    await expect(page.getByRole("heading", { name: "Invitation not found" })).toBeVisible();
    await expect(page.getByTestId("guest-name")).toHaveCount(0);
  }
});

test("database errors are sanitized and offer retry", async ({ page }) => {
  await page.goto("/invite/database-failure");
  await expect(page.getByRole("heading", { name: "A little pause" })).toBeVisible();
  await expect(page.getByText("Internal test failure, do not expose")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("missing original artwork does not show a fabricated invitation", async ({ page }) => {
  await page.route("**/images/wedding-invitation.png", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("/preview");
  await expect(page.getByRole("heading", { name: "The invitation is being prepared" })).toBeVisible();
  await expect(page.getByTestId("guest-name")).toHaveCount(0);
});

test("unauthenticated guests cannot enter either admin page", async ({ page }) => {
  for (const path of ["/admin", "/admin/guests"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByLabel("Email address")).toBeVisible();
  }
});

test("the generic social image is served without guest information", async ({ request }) => {
  const response = await request.get("/opengraph-image");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/png");
});

test("the approved artwork loads at its original proportions with the name inside the printed band", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/invite/jayasinghe-family");
  await expectOpen(page);
  const image = page.locator(".wedding-card img");
  expect(await image.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight])).toEqual([1056, 1490]);
  await expect(page.getByTestId("guest-name")).toHaveText("Mr. & Mrs. Jayasinghe & Family");
  const alignment = await page.getByTestId("guest-name").evaluate((band) => {
    const image = band.parentElement!.getBoundingClientRect();
    const overlay = band.getBoundingClientRect();
    return { above: (overlay.top - image.top) / image.height, below: (overlay.bottom - image.top) / image.height, ratio: image.width / image.height };
  });
  expect(alignment.above).toBeGreaterThan(889 / 1490);
  expect(alignment.below).toBeLessThan(949 / 1490);
  expect(alignment.ratio).toBeCloseTo(1056 / 1490, 3);
  await page.screenshot({ path: test.info().outputPath("approved-invitation.png"), fullPage: true });
});
