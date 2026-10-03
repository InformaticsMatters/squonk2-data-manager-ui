import { expect, test } from "@playwright/test";

test("renders GitHub-flavoured Markdown as formatted content", async ({ mount }) => {
  const component = await mount("features/MarkdownViewer/Formatted");

  await expect(component.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();
  await expect(component.locator("strong")).toHaveText("bold");
  await expect(component.locator("del")).toHaveText("struck");
  await expect(component.getByRole("link", { name: "link" })).toHaveAttribute(
    "href",
    "https://example.com",
  );
  await expect(component.getByRole("cell", { name: "0.92" })).toBeVisible();
  await expect(component.getByRole("checkbox")).toHaveCount(2);
  await expect(component.getByText("This file is too large")).toHaveCount(0);
});

test("never runs the file's own HTML or script URLs", async ({ mount, page }) => {
  const component = await mount("features/MarkdownViewer/Formatted");

  // Raw HTML is shown as the text it is, not parsed into elements.
  await expect(component.getByText("<script>window.injected = true</script>")).toBeVisible();
  await expect(component.locator("script")).toHaveCount(0);
  expect(await page.evaluate(() => "injected" in globalThis)).toBe(false);
  await expect(component.getByText("unsafe")).not.toHaveAttribute("href", /javascript:/u);
});

test("says when only the start of the file is shown", async ({ mount }) => {
  const component = await mount("features/MarkdownViewer/Truncated");

  await expect(component.getByText("This file is too large to show in full")).toBeVisible();
  await expect(component.getByRole("heading", { name: "Start of a long file" })).toBeVisible();
});
