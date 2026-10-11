import { expect, test } from "@playwright/test";

/**
 * Smoke test. Targets the Lab page, which is static (no database), so it runs in
 * CI without a live Postgres. Confirms the shell renders and navigation works.
 */
test("console renders and navigates", async ({ page }) => {
  await page.goto("/lab");
  await expect(page.getByRole("heading", { name: "Lab", level: 1 })).toBeVisible();
  // Architecture diagram is inline SVG with an aria-label (present on all widths).
  await expect(page.getByRole("img", { name: /architecture/i })).toBeVisible();
});
