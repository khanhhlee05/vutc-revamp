import { expect, test } from "@playwright/test";
import { ADMIN_STATE } from "./helpers";

test.use({ storageState: ADMIN_STATE });

test("staff can sign up for and drop an open event", async ({ page }) => {
  await page.goto("/events");
  const card = page.locator("li", { hasText: "Fixture: Open Event" }).first();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Sign up: Event Staff" }).click();
  await expect(page.getByRole("status")).toContainText("You are signed up");
  await expect(card.getByText("Signed up: Event Staff")).toBeVisible();

  await page.goto("/my-events");
  const row = page.locator("li", { hasText: "Fixture: Open Event" }).first();
  await row.getByRole("button", { name: "Drop" }).click();
  await expect(page.getByRole("status")).toContainText("removed from the event");
});

test("pre-open events hide event staff signup but show head tech roles to exec", async ({ page }) => {
  await page.goto("/events");
  const card = page.locator("li", { hasText: "Fixture: Confirmed Pre-open" }).first();
  await expect(card.getByText("Open for head tech and senior positions only")).toBeVisible();
  await expect(card.getByRole("button", { name: "Sign up: Audio Head Tech" })).toBeVisible();
});

test("personnel management can invite a member", async ({ page }) => {
  await page.goto("/manage/users/new");
  const email = `e2e-${Date.now()}@villanova.edu`;
  await page.fill("input[name=name]", "E2E Invitee");
  await page.fill("input[name=email]", email);
  await page.fill("input[name=gradYear]", "2028");
  await page.getByLabel("Senior Staff").check();
  await page.getByRole("button", { name: "Create account and send invite" }).click();
  await expect(page).toHaveURL(/\/manage\/users\/[^/]+\?created=1/);
  await expect(page.getByText("Account created and invite sent.")).toBeVisible();
  await expect(page.getByText("Has not set a password yet")).toBeVisible();
});

test("account page saves profile changes", async ({ page }) => {
  await page.goto("/account");
  await page.fill("input[name=phone]", "6105550199");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
});
