import { expect, test } from "@playwright/test";
import { ADMIN_STATE } from "./helpers";

test.use({ storageState: ADMIN_STATE });

test("timesheet, payroll, and invoice flow", async ({ page }) => {
  const name = `E2E Money Flow ${Date.now()}`;

  // Client request.
  await page.goto("/request");
  await page.fill("#orgName", "E2E Money Org");
  await page.fill("#contactName", "Pat Example");
  await page.fill("#contactEmail", "pat@villanova.edu");
  await page.fill("#contactPhone", "6105551234");
  await page.fill("#advisorName", "Dr. Advisor");
  await page.fill("#advisorEmail", "advisor@villanova.edu");
  await page.fill("#accountIndex", "123456");
  await page.fill("#name", name);
  await page.fill("#location", "Villanova Room");
  await page.fill("#eventDate", "2099-04-12");
  await page.fill("#expectedAttendance", "100");
  await page.fill("#startTime", "19:00");
  await page.fill("#endTime", "22:00");
  await page.fill("#reservationStart", "17:00");
  await page.fill("#reservationEnd", "23:00");
  await page.fill("#description", "Money flow test.");
  await page.getByRole("button", { name: "Submit request" }).click();
  await expect(page).toHaveURL(/\/brief\//);

  // Packages: Extended PA ($250, audio) and 2h Audio Op - Basic ($20/h, op_audio).
  await page.goto(`/manage/events?q=${encodeURIComponent(name)}`);
  await page.getByRole("link", { name }).first().click();
  await expect(page).toHaveURL(/\/manage\/events\/\d+$/);
  const eventId = page.url().match(/\/manage\/events\/(\d+)/)![1];
  await page.goto(`/manage/events/${eventId}/packages`);
  for (const [label, qty] of [
    ["Extended PA", "1"],
    ["Audio Op - Basic", "2"],
  ] as const) {
    const value = await page.locator("select[name=packageId] option", { hasText: label }).first().getAttribute("value");
    await page.selectOption("select[name=packageId]", value!);
    await page.fill("input[name=quantity]", qty);
    await page.getByRole("button", { name: "Add package" }).click();
    await expect(page.getByRole("cell", { name: label })).toBeVisible();
  }
  await expect(page.locator("dd.font-semibold")).toHaveText("$290.00");
  await page.getByRole("button", { name: "Email quote to client" }).click();
  await expect(page.getByText("Quote emailed to the client.")).toBeVisible();

  // Staff the event by management: the admin as AHT.
  await page.goto(`/manage/events/${eventId}/staff`);
  await page.selectOption("select[name=userId]", { label: "Dev Admin" });
  await page.selectOption("select[name=role]", "aht");
  await page.getByRole("button", { name: "Add to event" }).click();
  await expect(page.getByRole("cell", { name: "Audio Head Tech" })).toBeVisible();

  // Timesheet: AHT full run and load. Pay = 40 (op) + 125 (half of 250 by load); VUTC 125.
  await page.goto(`/events/${eventId}/timesheet`);
  await page.getByRole("button", { name: "Submit timesheet" }).click();
  await expect(page.getByText("Timesheet saved and pay calculated.")).toBeVisible();
  await expect(page.getByRole("cell", { name: "$165.00" }).first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "$125.00" }).first()).toBeVisible();

  // Payroll.
  await page.goto("/manage/payroll");
  await expect(page.getByRole("link", { name: new RegExp(name) })).toBeVisible();
  await page.getByRole("button", { name: "Create payroll from these events" }).click();
  await expect(page).toHaveURL(/\/manage\/payroll\/\d+$/);
  await expect(page.getByText("Dev Admin").first()).toBeVisible();
  await page.fill("input[name=paidOutAt]", "2099-05-01");
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Payout date saved.")).toBeVisible();
  const pdf = await page.request.get(page.url().replace(/\?.*$/, "") + "/payroll.pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");

  // Invoice.
  await page.goto(`/manage/events/${eventId}/bill`);
  await expect(page.getByText("$290.00").first()).toBeVisible();
  const invoice = await page.request.get(`/manage/events/${eventId}/invoice.pdf`);
  expect(invoice.status()).toBe(200);
  await page.getByRole("button", { name: "Email invoice to client" }).click();
  await expect(page.getByText("Invoice emailed to the client and the event marked billed.")).toBeVisible();
  await expect(page.getByText("Billed", { exact: true })).toBeVisible();

  // Mark paid.
  await page.getByRole("button", { name: "Mark paid" }).click();
  await expect(page.getByText("Marked as paid.")).toBeVisible();
  await expect(page.getByText("Paid", { exact: true })).toBeVisible();
});
