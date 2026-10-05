import { expect, test } from "@playwright/test";

test("renders GitHub-flavoured Markdown as formatted content", async ({ mount }) => {
  const component = await mount("projects/MarkdownViewer/Formatted");

  await expect(component.getByRole("heading", { level: 1, name: "Results" })).toBeVisible();
  await expect(component.locator("strong")).toHaveText("bold");
  await expect(component.locator("del")).toHaveText("struck");
  const external = component.getByRole("link", { exact: true, name: "link" });
  await expect(external).toHaveAttribute("href", "https://example.com");
  await expect(external).toHaveAttribute("target", "_blank");
  await expect(external).toHaveAttribute("rel", "noopener noreferrer");
  await expect(component.getByRole("cell", { name: "0.92" })).toBeVisible();
  await expect(component.getByRole("checkbox")).toHaveCount(2);
  await expect(component.getByText("This file is too large")).toHaveCount(0);
});

test("never runs the file's own HTML or script URLs", async ({ mount, page }) => {
  const component = await mount("projects/MarkdownViewer/Formatted");

  // Raw HTML is shown as the text it is, not parsed into elements.
  await expect(component.getByText("<script>window.injected = true</script>")).toBeVisible();
  await expect(component.locator("script")).toHaveCount(0);
  expect(await page.evaluate(() => "injected" in globalThis)).toBe(false);
  await expect(component.getByText("unsafe")).not.toHaveAttribute("href", /javascript:/u);
});

test("opens links and images inside the project that holds the file", async ({ mount }) => {
  const component = await mount("projects/MarkdownViewer/Formatted");
  const project = "/projects/project-33333333-3333-3333-3333-333333333333";

  await expect(component.getByRole("link", { name: "the method" })).toHaveAttribute(
    "href",
    `${project}/files/view?path=%2Fnotes%2Fmethod.md&viewer=markdown`,
  );
  await expect(component.getByRole("link", { name: "the poses" })).toHaveAttribute(
    "href",
    `${project}/files/view?path=%2Fnotes%2Fdata%2Fposes.sdf`,
  );
  await expect(component.getByRole("link", { name: "all results" })).toHaveAttribute(
    "href",
    `${project}/files?path=%2Fresults`,
  );
  await expect(component.getByText("outside the project")).not.toHaveAttribute("href", /.*/u);
  await expect(component.getByRole("img", { name: "plot" })).toHaveAttribute(
    "src",
    /\/api\/viewer-proxy\/project\/project-[\da-f-]+\/files\/notes\/img\/plot\.png$/u,
  );
});

test("says when only the start of the file is shown", async ({ mount }) => {
  const component = await mount("projects/MarkdownViewer/Truncated");

  await expect(component.getByText("This file is too large to show in full")).toBeVisible();
  await expect(component.getByRole("heading", { name: "Start of a long file" })).toBeVisible();
});
