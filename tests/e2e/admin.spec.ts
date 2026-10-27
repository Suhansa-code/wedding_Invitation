import { randomUUID } from "node:crypto";
import { expect, test, type Locator, type Page } from "@playwright/test";

async function signIn(page: Page, email: string, password = "test-admin-password") {
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in to the studio" }).click();
}

async function confirmOperation(row: Locator, name: string, message: RegExp, accept: boolean) {
  const page = row.page();
  const dialog = page.waitForEvent("dialog");
  const click = row.getByRole("button", { name, exact: true }).click();
  const prompt = await dialog;
  expect(prompt.type()).toBe("confirm");
  expect(prompt.message()).toMatch(message);
  if (accept) await prompt.accept();
  else await prompt.dismiss();
  await click;
}

test("admin denies nonmembers and manages isolated invitations from creation through signout", async ({ page, context }) => {
  test.setTimeout(120000);
  const unique = randomUUID();
  const prefix = `Journey ${unique}`;
  const automaticName = `${prefix} Automatic`;
  const customName = `${prefix} Custom 100%_VIP`;
  const editedName = `${prefix} Edited`;
  const customToken = `private-${unique}`;
  await test.step("reject invalid credentials and authenticated users outside the allowlist", async () => {
    await page.goto("/admin/login");
    await signIn(page, "admin@example.test", "wrong-password");
    await expect(page.locator("form").getByRole("alert")).toContainText("Unable to sign in with administrator access");
    await expect(page.getByRole("button", { name: "Sign in to the studio" })).toBeEnabled();
    await signIn(page, "guest@example.test");
    await expect(page.locator("form").getByRole("alert")).toContainText("Unable to sign in with administrator access");
    await expect(page.getByRole("button", { name: "Sign in to the studio" })).toBeEnabled();
    await page.goto("/admin/guests");
    await expect(page).toHaveURL(/\/admin\/login\?notice=access$/);
    expect((await context.cookies()).filter((cookie) => cookie.name.startsWith("sb-") && cookie.value)).toEqual([]);
  });

  await test.step("allowlisted login sets a real SSR session and loads dashboard counts", async () => {
    await signIn(page, "admin@example.test");
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole("heading", { name: "Every invitation, personal." })).toBeVisible();
    const totals = page.getByRole("region", { name: "Invitation totals" });
    await expect(totals).toBeVisible();
    await expect(totals.locator(".tabular-nums")).toHaveCount(3);
    for (const count of await totals.locator(".tabular-nums").allTextContents()) expect(count).toMatch(/^\d+$/);
    const cookies = (await context.cookies()).filter((cookie) => cookie.name.startsWith("sb-") && cookie.value);
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Every invitation, personal." })).toBeVisible();
  });

  const form = page.getByRole("region", { name: "Prepare an invitation" });
  const generated = page.getByRole("region", { name: "Generated invitation" });
  let automaticUrl = "";
  await test.step("create a secure automatic link and expose a usable clipboard fallback", async () => {
    await form.getByLabel("Guest name", { exact: true }).fill(automaticName);
    await form.getByLabel("Title", { exact: true }).selectOption("Dr.");
    await expect(form.getByLabel("Name on the invitation")).toHaveValue(`Dr. ${automaticName}`);
    await form.getByRole("button", { name: "Generate Invitation Link" }).click();
    await expect(generated).toContainText(`Dr. ${automaticName}`);
    automaticUrl = (await generated.getByRole("link", { name: /^Open invitation/ }).getAttribute("href"))!;
    expect(new URL(automaticUrl).pathname).toMatch(/^\/invite\/[A-Za-z0-9_-]{32}$/);
    await expect(form.getByLabel("Guest name", { exact: true })).toHaveValue("");
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: (url: string) => { document.body.dataset.copiedInvitation = url; return Promise.resolve(); } },
    }));
    await generated.getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(generated.getByRole("status")).toHaveText("Link copied.");
    expect(await page.evaluate(() => document.body.dataset.copiedInvitation)).toBe(automaticUrl);
    await page.evaluate(() => Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: () => Promise.reject(new Error("Clipboard denied for test")) },
    }));
    await generated.getByRole("button", { name: "Copy link", exact: true }).click();
    await expect(generated.getByRole("status")).toHaveText("Clipboard unavailable. Select and copy the link shown above.");
    await expect(generated).toContainText(automaticUrl);
  });

  await test.step("create a normalized custom token and reject duplicate tokens", async () => {
    await form.getByLabel("Guest name", { exact: true }).fill(`${prefix} Custom record`);
    await form.getByLabel("Name on the invitation").fill(customName);
    await form.getByLabel("Invitation link", { exact: true }).selectOption("custom");
    await form.getByLabel("Custom token").fill(`PRIVATE ${unique.toUpperCase()}`);
    await form.getByRole("button", { name: "Generate Invitation Link" }).click();
    await expect(generated).toContainText(customName);
    await expect(generated.getByRole("link", { name: /^Open invitation/ })).toHaveAttribute("href", `http://localhost:3100/invite/${customToken}`);
    await form.getByLabel("Guest name", { exact: true }).fill(`${prefix} Duplicate`);
    await form.getByLabel("Invitation link", { exact: true }).selectOption("custom");
    await form.getByLabel("Custom token").fill(customToken);
    await form.getByRole("button", { name: "Generate Invitation Link" }).click();
    await expect(form.getByRole("alert")).toHaveText("That invitation link is already in use. Choose another token.");
  });

  await page.getByRole("link", { name: "Guest list", exact: true }).click();
  const search = page.getByRole("search");
  await search.getByLabel("Search display names").fill(prefix.toLowerCase());
  await search.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("2 matching invitations", { exact: true })).toBeVisible();
  const row = page.getByRole("row").filter({ has: page.locator("code", { hasText: customToken }) });
  const visitor = await context.newPage();
  await visitor.emulateMedia({ reducedMotion: "reduce" });
  const customUrl = `http://localhost:3100/invite/${customToken}`;

  await test.step("search escaped names, clear empty results, and edit without changing the link", async () => {
    await expect(row).toContainText(customName);
    await search.getByLabel("Search display names").fill(`${prefix} Custom 100%_VIP`);
    await search.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByText("1 matching invitation", { exact: true })).toBeVisible();
    await expect(row).toBeVisible();
    await search.getByLabel("Search display names").fill(`${prefix} Missing`);
    await search.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByRole("heading", { name: "No matching invitations" })).toBeVisible();
    await search.getByRole("link", { name: "Clear", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/guests$/);
    await search.getByLabel("Search display names").fill(prefix);
    await search.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.getByText("2 matching invitations", { exact: true })).toBeVisible();
    await row.getByText("Edit guest details", { exact: true }).click();
    await row.getByLabel("Guest name", { exact: true }).fill(`${prefix} Updated record`);
    await row.getByLabel("Title", { exact: true }).selectOption("Mrs.");
    await row.getByLabel("Name on the invitation").fill(editedName);
    await row.getByRole("button", { name: "Save guest details" }).click();
    await expect(row.getByRole("status").filter({ hasText: "Guest details saved." })).toContainText("The invitation link has not changed.");
    await expect(row.locator("code")).toHaveText(customToken);
    await expect(row.getByRole("link", { name: /^Open invitation/ })).toHaveAttribute("href", customUrl);
    await visitor.goto(customUrl);
    await expect(visitor.getByTestId("guest-name")).toHaveText(editedName);
    await visitor.getByRole("link", { name: "Get Directions", exact: true }).scrollIntoViewIfNeeded();
    await expect(visitor.getByRole("link", { name: "Get Directions", exact: true })).toBeVisible();
  });

  await test.step("cancel and confirm deactivation and reactivation with live link checks", async () => {
    await confirmOperation(row, "Deactivate", /Deactivate the invitation.*link will stop working/, false);
    await expect(row.locator(".status")).toHaveText("Active");
    await page.reload();
    await expect(row.locator(".status")).toHaveText("Active");
    await confirmOperation(row, "Deactivate", /Deactivate the invitation.*link will stop working/, true);
    await expect(row.locator(".status")).toHaveText("Inactive");
    await expect(row.getByRole("status").filter({ hasText: "Invitation deactivated." })).toBeVisible();
    await visitor.goto(customUrl);
    await expect(visitor.getByRole("heading", { name: "Invitation not found" })).toBeVisible();
    await expect(visitor.getByTestId("guest-name")).toHaveCount(0);
    await confirmOperation(row, "Reactivate", /Reactivate the invitation.*existing link will work again/, false);
    await expect(row.locator(".status")).toHaveText("Inactive");
    await page.reload();
    await expect(row.locator(".status")).toHaveText("Inactive");
    await confirmOperation(row, "Reactivate", /Reactivate the invitation.*existing link will work again/, true);
    await expect(row.locator(".status")).toHaveText("Active");
    await expect(row.getByRole("status").filter({ hasText: "Invitation activated." })).toBeVisible();
    await visitor.goto(customUrl);
    await expect(visitor.getByTestId("guest-name")).toHaveText(editedName);
  });

  await test.step("cancel regeneration, then replace the token and invalidate only the old link", async () => {
    await confirmOperation(row, "Regenerate link", /Replace the invitation link.*old link will immediately stop working/, false);
    await page.reload();
    await expect(row.locator("code")).toHaveText(customToken);
    await confirmOperation(row, "Regenerate link", /Replace the invitation link.*old link will immediately stop working/, true);
    const updatedRow = page.getByRole("row").filter({ has: page.getByText(editedName, { exact: true }) });
    await expect(updatedRow.getByRole("status").filter({ hasText: "New link generated." })).toContainText("The previous link no longer works.");
    const newToken = await updatedRow.locator("code").innerText();
    expect(newToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
    expect(newToken).not.toBe(customToken);
    const newUrl = (await updatedRow.getByRole("link", { name: /^Open invitation/ }).getAttribute("href"))!;
    await visitor.goto(customUrl);
    await expect(visitor.getByRole("heading", { name: "Invitation not found" })).toBeVisible();
    await visitor.goto(newUrl);
    await expect(visitor.getByTestId("guest-name")).toHaveText(editedName);
    await visitor.getByRole("link", { name: "Get Directions", exact: true }).scrollIntoViewIfNeeded();
    await expect(visitor.getByRole("link", { name: "Get Directions", exact: true })).toBeVisible();
    await visitor.goto(automaticUrl);
    await expect(visitor.getByTestId("guest-name")).toHaveText(`Dr. ${automaticName}`);
    await visitor.close();
  });

  await test.step("retired custom tokens cannot be assigned to another guest", async () => {
    await form.getByLabel("Guest name", { exact: true }).fill(`${prefix} Reused token`);
    await form.getByLabel("Invitation link", { exact: true }).selectOption("custom");
    await form.getByLabel("Custom token").fill(customToken);
    await form.getByRole("button", { name: "Generate Invitation Link" }).click();
    await expect(form.getByRole("alert")).toHaveText("That invitation link is already in use. Choose another token.");
  });

  const automaticRow = page.getByRole("row").filter({ has: page.getByText(`Dr. ${automaticName}`, { exact: true }) });
  await test.step("Open launches the personalized guest experience in a new tab", async () => {
    const openEvent = page.waitForEvent("popup");
    await automaticRow.getByRole("link", { name: /^Open invitation/ }).click();
    const opened = await openEvent;
    await opened.emulateMedia({ reducedMotion: "no-preference" });
    await expect(opened).toHaveURL(automaticUrl);
    await expect(opened.locator("main.scene-welcome .welcome-scene")).toBeVisible();
    await opened.getByRole("button", { name: "Skip Animation", exact: true }).click();
    await expect(opened.locator("main.scene-invitation article.wedding-invitation")).toBeVisible();
    await expect(opened.getByTestId("guest-name")).toHaveText(`Dr. ${automaticName}`);
    await opened.getByRole("link", { name: "Get Directions", exact: true }).scrollIntoViewIfNeeded();
    await expect(opened.getByRole("link", { name: "Get Directions", exact: true })).toBeVisible();
    await opened.close();
  });

  try {
    await test.step("preview skips animation without persisting it", async () => {
      const previewEvent = page.waitForEvent("popup");
      await automaticRow.getByRole("link", { name: /^Preview invitation/ }).click();
      const preview = await previewEvent;
      await preview.emulateMedia({ reducedMotion: "no-preference" });
      await expect(preview).toHaveURL(`${automaticUrl}?preview=1`);
      await expect(preview.locator("main.scene-invitation article.wedding-invitation")).toBeVisible({ timeout: 3000 });
      await expect(preview.locator(".welcome-scene, .envelope-scene")).toHaveCount(0);
      await expect(preview.getByTestId("guest-name")).toHaveText(`Dr. ${automaticName}`);
      expect(await preview.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith("di:opened:")))).toEqual([]);
      await preview.goto(automaticUrl);
      await expect(preview.locator("main.scene-welcome .welcome-scene")).toBeVisible();
      await preview.getByRole("button", { name: "Skip Animation", exact: true }).click();
      await expect(preview.locator("main.scene-invitation article.wedding-invitation")).toBeVisible();
      await preview.getByRole("link", { name: "Get Directions", exact: true }).scrollIntoViewIfNeeded();
      await expect(preview.getByRole("link", { name: "Get Directions", exact: true })).toBeVisible();
      await preview.close();
    });
  } finally {
    await test.step("signout clears the session and blocks both protected pages", async () => {
      await page.getByRole("button", { name: "Sign out", exact: true }).click();
      await expect(page).toHaveURL(/\/admin\/login$/);
      expect((await context.cookies()).filter((cookie) => cookie.name.startsWith("sb-") && cookie.value)).toEqual([]);
      for (const path of ["/admin", "/admin/guests"]) {
        await page.goto(path);
        await expect(page).toHaveURL(/\/admin\/login\?notice=access$/);
        await expect(page.getByLabel("Email address")).toBeVisible();
      }
    });
  }
});
