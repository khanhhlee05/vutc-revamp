import { expect, test as setup } from "@playwright/test";

import { ADMIN_STATE } from "./helpers";

/** Signs in once so staff tests share a session and stay under the login rate limit. */
setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.fill("input[name=email]", "admin@vutc.test");
  await page.fill("input[name=password]", "dev-password-123!");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: ADMIN_STATE });
});
