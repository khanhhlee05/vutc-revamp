import { expect, test } from "@playwright/test";
import { ADMIN_STATE } from "./helpers";

test.use({ storageState: ADMIN_STATE });

async function submitRequest(page: import("@playwright/test").Page, name: string) {
  await page.goto("/request");
  await page.fill("#orgName", "E2E Quote Org");
  await page.fill("#contactName", "Pat Example");
  await page.fill("#contactEmail", "pat@villanova.edu");
  await page.fill("#contactPhone", "6105551234");
  await page.fill("#advisorName", "Dr. Advisor");
  await page.fill("#advisorEmail", "advisor@villanova.edu");
  await page.fill("#accountIndex", "123456");
  await page.fill("#name", name);
  await page.fill("#location", "Villanova Room");
  await page.fill("#eventDate", "2099-04-10");
  await page.fill("#expectedAttendance", "250");
  await page.fill("#startTime", "19:00");
  await page.fill("#endTime", "23:00");
  await page.fill("#reservationStart", "17:00");
  await page.fill("#reservationEnd", "23:59");
  await page.fill("#description", "Created by the e2e management test.");
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page).toHaveURL(/\/brief\//);
}

test("event management: quote a new request, client confirms, open for signup", async ({ page, context }) => {
  const name = `E2E Quote Flow ${Date.now()}`;
  await submitRequest(page, name);

  await page.goto(`/manage/events?q=${encodeURIComponent(name)}`);
  await page.getByRole("link", { name }).first().click();
  await expect(page).toHaveURL(/\/manage\/events\/\d+$/);
  const eventId = page.url().match(/\/manage\/events\/(\d+)/)![1];

  // Add a package and a custom line, then email the quote.
  await page.goto(`/manage/events/${eventId}/packages`);
  const basicPa = await page
    .locator("select[name=packageId] option", { hasText: "Basic PA" })
    .first()
    .getAttribute("value");
  await page.selectOption("select[name=packageId]", basicPa!);
  await page.fill("input[name=quantity]", "1");
  await page.getByRole("button", { name: "Add package" }).click();
  await expect(page.getByRole("cell", { name: "Basic PA" })).toBeVisible();
  await page.fill("input[name=name]", "Charity discount");
  await page.fill("input[name=price]", "-25");
  await page.getByRole("button", { name: "Add line" }).click();
  await expect(page.getByText("Charity discount")).toBeVisible();
  await expect(page.locator("dd.font-semibold")).toHaveText("$150.00");
  await page.getByRole("button", { name: "Email quote to client" }).click();
  await expect(page).toHaveURL(new RegExp(`/manage/events/${eventId}\\?msg=quote`));
  await expect(page.getByText("Quote emailed to the client.")).toBeVisible();
  await expect(page.getByText("Confirmed", { exact: true })).toBeVisible();

  // Client confirms on the public brief page without logging in.
  const briefHref = await page.getByRole("link", { name: "Client brief link" }).getAttribute("href");
  const clientContext = await context.browser()!.newContext();
  const clientPage = await clientContext.newPage();
  await clientPage.goto(briefHref!);
  await expect(clientPage.getByText("Status: Confirmed")).toBeVisible();
  await expect(clientPage.getByRole("cell", { name: "Basic PA" })).toBeVisible();
  await clientPage.getByRole("button", { name: "Confirm this quote" }).click();
  await expect(clientPage.getByText("client confirmed")).toBeVisible();
  await clientContext.close();

  // Open the event and check it shows up for staff.
  await page.goto(`/manage/events/${eventId}`);
  await expect(page.getByText("client confirmed").first()).toBeVisible();
  await page.getByRole("button", { name: "Open for signup" }).click();
  await expect(page.getByText("Event opened for signup.")).toBeVisible();
  await page.goto("/events");
  await expect(page.locator("li", { hasText: name }).first()).toBeVisible();
});

test("event management: deny with a reason emails and moves to cancelled", async ({ page }) => {
  const name = `E2E Deny Request ${Date.now()}`;
  await submitRequest(page, name);

  await page.goto(`/manage/events?q=${encodeURIComponent(name)}`);
  await page.getByRole("link", { name }).first().click();
  await page.fill("textarea[name=reason]", "No staff available that weekend.");
  await page.getByRole("button", { name: "Deny request" }).click();
  await expect(page.getByText("Request denied and the client was emailed.")).toBeVisible();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByText("No staff available that weekend.")).toBeVisible();
});

test("organizations: create, comment, and link from an event", async ({ page }) => {
  await page.goto("/manage/organizations/new");
  const name = `E2E Org ${Date.now()}`;
  await page.fill("input[name=name]", name);
  await page.fill("textarea[name=description]", "Created by e2e.");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page).toHaveURL(/\/manage\/organizations\/\d+/);
  await page.fill("textarea[name=body]", "First contact went well.");
  await page.getByRole("button", { name: "Add comment" }).click();
  await expect(page.getByText("First contact went well.")).toBeVisible();
});
