import { expect, test, type Page } from "@playwright/test";

test.afterEach(async ({ page }) => {
  const errors = await page.pageErrors();
  expect(errors.filter((error) => /hydration|didn't match|Maximum update depth/i.test(error.message))).toEqual([]);
});

async function expectWelcome(page: Page, name: string) {
  await expect(page.locator("main.scene-welcome .welcome-scene")).toBeVisible();
  await expect(page.locator(".welcome-guest")).toHaveText(`Dear ${name}`);
  await expect(page.getByRole("button", { name: "Open My Invitation", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Skip Animation", exact: true })).toBeVisible();
  await expect(page.locator(".invitation-final article.wedding-invitation")).toHaveCount(0);
  await expect(page.getByTestId("guest-name")).toHaveCount(0);
  await expect(page.locator(".wedding-actions")).toHaveCount(0);
}

async function expectOpen(page: Page) {
  await expect(page.locator("main.scene-invitation article.wedding-invitation")).toBeVisible({ timeout: 10000 });
  await expect(page.locator(".invitation-final")).toHaveCSS("opacity", "1");
  await expect(page.locator(".welcome-scene, .envelope-scene")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Skip Animation", exact: true })).toHaveCount(0);
  const directions = page.locator(".wedding-actions").getByRole("link", { name: "Get Directions", exact: true });
  // The HTML invitation can be taller than the viewport, especially on mobile.
  await directions.scrollIntoViewIfNeeded();
  await expect(directions).toBeVisible();
  await expect(directions).toHaveAttribute("href", "https://maps.app.goo.gl/QGAZavf3ThqrCqGQ8");
  await expect(directions).toHaveAttribute("target", "_blank");
  await expect(directions).toHaveAttribute("rel", "noopener noreferrer");
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test("home page is mobile-safe and opens the generic welcome experience", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dulmi & Isuru" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.getByRole("link", { name: "Open the invitation", exact: true }).click();
  await expect(page).toHaveURL(/\/preview$/);
  await expectWelcome(page, "family & friends");
  await page.getByRole("button", { name: "Skip Animation", exact: true }).click();
  await expectOpen(page);
  await expect(page.getByTestId("guest-name")).toHaveText("family & friends");
});

test("first visit welcomes the guest, opens the layered envelope, and remembers only this token", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/invite/perera-family");
  await expectWelcome(page, "Mr. & Mrs. Perera");
  await expect(page.locator(".welcome-mandala path")).toHaveCount(1);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: test.info().outputPath("welcome.png"), fullPage: true });

  await page.getByRole("button", { name: "Open My Invitation", exact: true }).click();
  await expect(page.locator("main.scene-envelope")).toBeVisible();
  await expect(page.locator(".envelope-scene")).toBeVisible();
  await expect(page.locator(".envelope-recipient span")).toHaveText("Mr. & Mrs. Perera");
  await expect(page.getByRole("button", { name: "Skip Animation", exact: true })).toBeVisible();
  await expect(page.locator(".invitation-final article.wedding-invitation")).toHaveCount(0);
  await expect(page.locator(".opening-letter article.wedding-invitation")).toHaveCount(1);
  await expect(page.locator(".opening-card-window")).toHaveAttribute("inert", "");
  await expect(page.locator(".wedding-actions")).toHaveCount(0);

  await expect(page.locator('main.scene-envelope .envelope-scene[data-stage="opening"]')).toBeVisible();
  await expect(page.locator(".experience-content")).toBeFocused();
  const layers = await page.locator(".opening-envelope").evaluate((envelope) => {
    const back = envelope.querySelector<HTMLElement>(".opening-back")!;
    const letter = envelope.querySelector<HTMLElement>("[data-envelope-card]")!;
    const pocket = envelope.querySelector<HTMLElement>(".opening-pocket")!;
    const flap = envelope.querySelector<HTMLElement>("[data-envelope-flap]")!;
    return {
      separate: new Set([back, letter, pocket, flap]).size,
      perspective: parseFloat(getComputedStyle(envelope).perspective),
      back: Number(getComputedStyle(back).zIndex),
      letter: Number(getComputedStyle(letter).zIndex),
      pocket: Number(getComputedStyle(pocket).zIndex),
      flap: Number(getComputedStyle(flap).zIndex),
      transformStyle: getComputedStyle(flap).transformStyle,
      originY: parseFloat(getComputedStyle(flap).transformOrigin.split(" ")[1]),
      faces: Array.from(flap.children, (face) => getComputedStyle(face).backfaceVisibility),
    };
  });
  expect(layers.separate).toBe(4);
  expect(layers.perspective).toBeGreaterThan(0);
  expect(layers.back).toBeLessThan(layers.letter);
  expect(layers.letter).toBeLessThan(layers.pocket);
  expect(layers.pocket).toBeLessThan(layers.flap);
  expect(layers.transformStyle).toBe("preserve-3d");
  expect(layers.originY).toBe(0);
  expect(layers.faces).toEqual(["hidden", "hidden"]);

  // useAnimate awaits each stage; wait for the real hinge/letter sequence, not a synthetic timeline seek.
  await expect(page.locator("[data-envelope-flap]")).toHaveCSS("z-index", "1");
  await expect.poll(() => page.locator(".opening-envelope").evaluate((envelope) => {
    const letter = envelope.querySelector("[data-envelope-card]")!;
    const pocket = envelope.querySelector(".opening-pocket")!;
    return pocket.getBoundingClientRect().top - letter.getBoundingClientRect().top;
  })).toBeGreaterThan(20);
  const opening = await page.locator(".opening-envelope").evaluate((envelope) => {
    const flap = envelope.querySelector<HTMLElement>("[data-envelope-flap]")!;
    const letter = envelope.querySelector<HTMLElement>("[data-envelope-card]")!;
    const rotation = new DOMMatrixReadOnly(getComputedStyle(flap).transform);
    return {
      rotationX: Math.abs(Math.atan2(rotation.m23, rotation.m22) * 180 / Math.PI),
      flap: Number(getComputedStyle(flap).zIndex),
      letter: Number(getComputedStyle(letter).zIndex),
      pocket: Number(getComputedStyle(envelope.querySelector(".opening-pocket")!).zIndex),
    };
  });
  expect(opening.rotationX).toBeCloseTo(180, 0);
  expect(opening.flap).toBeLessThan(opening.letter);
  expect(opening.letter).toBeLessThan(opening.pocket);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: test.info().outputPath("envelope-opening.png"), fullPage: true });

  await expectOpen(page);
  await expect(page.locator(".invitation-final").getByTestId("guest-name")).toHaveText("Mr. & Mrs. Perera");
  await expect(page.locator(".experience-content")).toBeFocused();
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: test.info().outputPath("invitation.png"), fullPage: true });
  const saved = await page.evaluate(() => Object.entries(sessionStorage).filter(([key]) => key.startsWith("di:opened:")));
  expect(saved).toHaveLength(1);
  expect(saved[0][0]).toMatch(/^di:opened:[a-f0-9]{24}$/);
  expect(saved[0][1]).toBe("1");
  await page.reload();
  await expectOpen(page);
  await expect(page.getByTestId("guest-name")).toHaveText("Mr. & Mrs. Perera");
  await page.goto("/invite/silva-family");
  await expectWelcome(page, "Mr. Silva & Family");
  await page.goto("/invite/perera-family");
  await expectOpen(page);
});

test("keyboard skip works from welcome and replay; cancelled sequences cannot restart later", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/invite/perera-family");
  await expectWelcome(page, "Mr. & Mrs. Perera");
  const skip = page.getByRole("button", { name: "Skip Animation", exact: true });
  await skip.focus();
  await page.keyboard.press("Enter");
  await expectOpen(page);
  await expect(page.locator(".experience-content")).toHaveAttribute("tabindex", "-1");
  await expect(page.locator(".experience-content")).toBeFocused();

  for (const stage of ["appearing", "opening"]) {
    const replay = page.locator(".wedding-actions").getByRole("button", { name: "Replay Envelope", exact: true });
    await replay.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(`main.scene-envelope .envelope-scene[data-stage="${stage}"]`)).toBeVisible();
    await expect(page.locator(".experience-content")).toBeFocused();
    await skip.focus();
    await page.keyboard.press("Space");
    await expectOpen(page);
    await expect(page.locator(".experience-content")).toBeFocused();
  }

  // Observe past the entire cancelled sequence, including any stale onOpening/onComplete callbacks.
  const lateScenes = await page.locator("main.invitation-experience").evaluate(async (main) => {
    const scenes: string[] = [];
    const observer = new MutationObserver(() => scenes.push(main.className));
    observer.observe(main, { attributes: true, attributeFilter: ["class"] });
    await new Promise((resolve) => setTimeout(resolve, 6000));
    observer.disconnect();
    return scenes;
  });
  expect(lateScenes).toEqual([]);
  await expectOpen(page);
  await expect(page.getByTestId("guest-name")).toHaveText("Mr. & Mrs. Perera");
});

test("reduced motion bypasses welcome and the envelope, including replay", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/invite/perera-family");
  await expectOpen(page);
  await expect(page.getByTestId("guest-name")).toHaveText("Mr. & Mrs. Perera");
  await page.locator(".wedding-actions").getByRole("button", { name: "Replay Envelope", exact: true }).click();
  await expectOpen(page);
  await expect(page.locator(".experience-content")).toBeFocused();
  await page.reload();
  await expectOpen(page);
});

test("preview bypasses the sequence without persisting an opened session, even after replay and skip", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/invite/perera-family?preview=1");
  await expectOpen(page);
  await expect(page.getByTestId("guest-name")).toHaveText("Mr. & Mrs. Perera");
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith("di:opened:")))).toEqual([]);
  await page.locator(".wedding-actions").getByRole("button", { name: "Replay Envelope", exact: true }).click();
  await expect(page.locator("main.scene-envelope .envelope-scene")).toBeVisible();
  await page.getByRole("button", { name: "Skip Animation", exact: true }).click();
  await expectOpen(page);
  expect(await page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith("di:opened:")))).toEqual([]);
  await page.reload();
  await expectOpen(page);
  await page.goto("/invite/perera-family");
  await expectWelcome(page, "Mr. & Mrs. Perera");
});

test("different guests never receive each other's names or metadata", async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const second = await context.newPage();
  await second.emulateMedia({ reducedMotion: "reduce" });
  const [firstResponse, secondResponse] = await Promise.all([page.goto("/invite/perera-family"), second.goto("/invite/silva-family")]);
  await expectOpen(page);
  await expectOpen(second);
  await expect(page.getByTestId("guest-name")).toHaveText("Mr. & Mrs. Perera");
  await expect(second.getByTestId("guest-name")).toHaveText("Mr. Silva & Family");
  expect(firstResponse?.headers()["cache-control"]).toContain("no-store");
  expect(secondResponse?.headers()["cache-control"]).toContain("no-store");
  for (const guestPage of [page, second]) {
    await expect(guestPage.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(guestPage.locator('meta[property="og:title"]')).toHaveAttribute("content", "Dulmi & Isuru | Wedding Invitation");
  }
  await expect(page.getByText("Mr. Silva & Family", { exact: true })).toHaveCount(0);
  await expect(second.getByText("Mr. & Mrs. Perera", { exact: true })).toHaveCount(0);
});

test("the HTML card preserves the printed content and three-column date arrangement", async ({ page }) => {
  await page.goto("/invite/perera-family?preview=1");
  await expectOpen(page);
  const card = page.locator(".invitation-final article.wedding-invitation");
  await expect(card.locator(".wedding-introduction")).toHaveText("Together with our parents ,We");
  await expect(card.locator(".wedding-bride .wedding-family")).toHaveText("Daughter of Mr and MrsPadukka");
  await expect(card.locator(".wedding-groom .wedding-family")).toHaveText("Son of Mr and MrsEdiriweera");
  await expect(card.locator(".wedding-time")).toHaveText("FROM 10 AM TO 4.00 PM");
  await expect(card.locator(".wedding-venue-name")).toHaveText("The Stallions Banquet Hall");
  await expect(card.locator(".wedding-address")).toHaveText("No: B/2 Nayagoda Road, Gonapola");
  await expect(card.locator(".wedding-guest-dots")).toHaveCount(2);
  await expect(card.locator(".wedding-contact").nth(0)).toHaveAttribute("href", "tel:+94762101024");
  await expect(card.locator(".wedding-contact").nth(1)).toHaveAttribute("href", "tel:+94772228796");

  for (const width of [320, 390, 768, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    const layout = await card.locator(".wedding-date").evaluate((date) => {
      const month = date.querySelector<HTMLElement>(".wedding-month")!;
      const center = date.querySelector<HTMLElement>(".wedding-date-center")!;
      const year = date.querySelector<HTMLElement>(".wedding-year")!;
      const weekday = date.querySelector<HTMLElement>(".wedding-weekday")!;
      const day = date.querySelector<HTMLElement>(".wedding-day")!;
      return {
        text: [month.textContent, weekday.textContent, day.textContent, year.textContent],
        columns: month.getBoundingClientRect().right <= center.getBoundingClientRect().left + 1 && center.getBoundingClientRect().right <= year.getBoundingClientRect().left + 1,
        stacked: weekday.getBoundingClientRect().bottom <= day.getBoundingClientRect().top + 1,
        separators: [getComputedStyle(center).borderLeftWidth, getComputedStyle(center).borderRightWidth],
        bold: [getComputedStyle(month).fontWeight, getComputedStyle(year).fontWeight],
      };
    });
    expect(layout.text).toEqual(["NOVEMBER", "MONDAY", "23", "2026"]);
    expect(layout.columns).toBe(true);
    expect(layout.stacked).toBe(true);
    expect(layout.separators).toEqual(["1px", "1px"]);
    expect(layout.bold).toEqual(["700", "700"]);
    await expectNoHorizontalOverflow(page);
  }
});

test("a long guest name opens through the real envelope at 320px and stays readable in landscape", async ({ page }) => {
  const name = "Mr. & Mrs. Wickramasinghe-Jayawardene & Their Beloved Family";
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/invite/long-family-name");
  await expectWelcome(page, name);
  await expectNoHorizontalOverflow(page);
  await page.getByRole("button", { name: "Open My Invitation", exact: true }).click();
  await expect(page.locator(".opening-seal")).toBeVisible();
  const emergingWidth = await page.locator(".opening-letter-artwork").evaluate((artwork) => (artwork as HTMLElement).offsetWidth);
  expect(emergingWidth).toBe(300);
  await expectOpen(page);
  await expect(page.getByTestId("guest-name")).toHaveText(name);
  expect(await page.locator(".invitation-final article").evaluate((card) => card.getBoundingClientRect().width)).toBe(emergingWidth);
  await page.setViewportSize({ width: 740, height: 320 });
  await expectNoHorizontalOverflow(page);
  await page.locator(".wedding-actions").getByRole("button", { name: "Replay Envelope", exact: true }).click();
  await expect(page.locator('.envelope-scene[data-stage="appearing"]')).toBeVisible();
  await page.getByRole("button", { name: "Skip Animation", exact: true }).click();
  await expectOpen(page);
  await expect(page.getByTestId("guest-name")).toHaveText(name);
});

for (const [token, name] of [
  ["fernando-invitation", "Mrs. Fernando"],
  ["jayasinghe-family", "Mr. & Mrs. Jayasinghe & Family"],
  ["doctor-perera", "Dr. Perera & Family"],
  ["long-family-name", "Mr. & Mrs. Wickramasinghe-Jayawardene & Their Beloved Family"],
]) {
  test(`name stays centered, readable, and contained at 320px: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/invite/${token}`);
    await expectOpen(page);
    const guest = page.locator("article.wedding-invitation").getByTestId("guest-name");
    await guest.scrollIntoViewIfNeeded();
    await expect(guest).toBeVisible();
    await expect(guest).toHaveText(name);
    const metrics = await guest.evaluate((text) => {
      const box = text.getBoundingClientRect();
      const line = text.parentElement!;
      const band = line.getBoundingClientRect();
      const style = getComputedStyle(text);
      return {
        offset: Math.abs((box.left + box.width / 2) - (band.left + band.width / 2)),
        fits: text.scrollHeight <= text.clientHeight + 1 && text.scrollWidth <= text.clientWidth + 1,
        inBand: box.top >= band.top - 1 && box.bottom <= band.bottom + 1 && box.left >= band.left && box.right <= band.right,
        directFlexChild: line.classList.contains("wedding-guest-line") && getComputedStyle(line).display === "flex",
        fontSize: parseFloat(style.fontSize),
        height: box.height,
        lineHeight: parseFloat(style.lineHeight),
      };
    });
    expect(metrics.offset).toBeLessThan(1);
    expect(metrics.fits, JSON.stringify(metrics)).toBe(true);
    expect(metrics.inBand).toBe(true);
    expect(metrics.directFlexChild).toBe(true);
    expect(metrics.fontSize).toBeGreaterThanOrEqual(18);
    if (token === "long-family-name") expect(metrics.height).toBeGreaterThan(metrics.lineHeight * 2);
    await expectNoHorizontalOverflow(page);
    if (token === "long-family-name") {
      await page.screenshot({ path: test.info().outputPath("long-name-320.png"), fullPage: true });
      for (const width of [375, 768, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        await expectNoHorizontalOverflow(page);
      }
    }
  });
}

test("invalid and revoked tokens have a graceful private 404, including preview requests", async ({ page }) => {
  for (const token of ["bad", "revoked-invitation", "unknown-invitation"]) {
    for (const query of ["", "?preview=1"]) {
      await page.goto(`/invite/${token}${query}`);
      await expect(page.getByRole("heading", { name: "Invitation not found" })).toBeVisible();
      await expect(page.getByTestId("guest-name")).toHaveCount(0);
      await expect(page.locator("article.wedding-invitation, .welcome-guest")).toHaveCount(0);
    }
  }
});

test("database errors are sanitized and offer retry", async ({ page }) => {
  await page.goto("/invite/database-failure");
  await expect(page.getByRole("heading", { name: "A little pause" })).toBeVisible();
  await expect(page.getByText("Internal test failure, do not expose")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("HTML invitation uses the real couple crop and SVG mandala even when the full original is missing", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route("**/images/wedding-invitation.png", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("/invite/jayasinghe-family");
  expect(await page.evaluate(async () => (await fetch("/images/wedding-invitation.png")).status)).toBe(404);
  await expectOpen(page);
  const card = page.locator("article.wedding-invitation");
  await expect(card.getByRole("heading", { name: "Wedding Invitation", exact: true })).toBeVisible();
  await expect(card.getByTestId("guest-name")).toHaveText("Mr. & Mrs. Jayasinghe & Family");
  await expect(card.locator("img")).toHaveCount(1);
  const image = card.locator("img.wedding-couple-image");
  await expect(image).toHaveAttribute("src", "/images/wedding-couple.webp");
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => [element.naturalWidth, element.naturalHeight])).toEqual([246, 374]);
  const proportions = await image.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return box.width / box.height;
  });
  expect(proportions).toBeCloseTo(246 / 374, 3);
  await expect(card.locator('img[src*="wedding-invitation.png"]')).toHaveCount(0);
  await expect(card.locator(".wedding-mandala-clip > svg")).toHaveCount(1);
  await expect(card.locator(".wedding-mandala-clip svg path")).toHaveAttribute("d", /^M/);
  await expect(page.getByRole("heading", { name: "The invitation is being prepared" })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
  await page.screenshot({ path: test.info().outputPath("html-invitation-original-404.png"), fullPage: true });
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
