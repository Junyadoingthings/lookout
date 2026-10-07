import { expect, test } from "@playwright/test";

// Phase 0 placeholder. Phase 4 replaces this with the real flow:
// open queue -> open alert -> set verdict.
test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "VANTAGE" })).toBeVisible();
});
