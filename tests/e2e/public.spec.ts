import { expect, test } from "@playwright/test";

test("public pages render", async ({ page }) => {
  for (const [path, heading] of [
    ["/", "Serving the Villanova Community"],
    ["/about", "About Villanova University Tech Crew"],
    ["/faqs", "Frequently Asked Questions"],
    ["/policies", "Policies for Clients"],
    ["/calendar", "Event Calendar"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
  }
});

test("a client can submit an event request and reach the brief", async ({ page }) => {
  await page.goto("/request");
  await page.fill("#orgName", "Blue Key Society");
  await page.fill("#contactName", "Pat Example");
  await page.fill("#contactEmail", "pat@villanova.edu");
  await page.fill("#contactPhone", "6105551234");
  await page.fill("#advisorName", "Dr. Advisor");
  await page.fill("#advisorEmail", "advisor@villanova.edu");
  await page.fill("#accountIndex", "123456");
  await page.fill("#name", "E2E Spring Formal");
  await page.fill("#location", "Villanova Room");
  await page.fill("#eventDate", "2099-04-10");
  await page.fill("#expectedAttendance", "250");
  await page.fill("#startTime", "19:00");
  await page.fill("#endTime", "23:00");
  await page.fill("#reservationStart", "17:00");
  await page.fill("#reservationEnd", "23:59");
  await page.getByLabel("Wireless Microphones").check();
  await page.getByLabel("Uplighting").check();
  await page.fill("#description", "Formal with a DJ and dancing.");
  await page.getByRole("button", { name: "Submit request" }).click();

  await expect(page).toHaveURL(/\/brief\/[A-Za-z0-9_-]+\?submitted=1/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("E2E Spring Formal");
  await expect(page.getByText("Status: New Request")).toBeVisible();
  await expect(page.getByText("Wireless Microphones")).toBeVisible();
  // No quote and no confirm button before event management acts.
  await expect(page.getByRole("button", { name: "Confirm this quote" })).toHaveCount(0);
});

test("validation errors are shown without losing input", async ({ page }) => {
  await page.goto("/request");
  await page.fill("#orgName", "Keep Me");
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page.getByText("Required").first()).toBeVisible();
  await expect(page.locator("#orgName")).toHaveValue("Keep Me");
});

test("an unknown brief token is a 404", async ({ page }) => {
  const res = await page.goto("/brief/" + "x".repeat(40));
  expect(res?.status()).toBe(404);
});

test("staff login and logout", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
  await page.fill("input[name=email]", "admin@vutc.test");
  await page.fill("input[name=password]", "wrong-password-xx");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect email or password.")).toBeVisible();

  await page.fill("input[name=password]", "dev-password-123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome, Dev Admin");

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
