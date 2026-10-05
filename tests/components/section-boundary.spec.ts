import { expect, test } from "@playwright/test";

test("a section previews its shape until its read answers", async ({ mount }) => {
  const component = await mount("components/SectionBoundary/Section");

  const skeleton = component.getByRole("rowgroup", { name: "Loading" });
  await expect(skeleton).toBeVisible();
  await expect(component.getByRole("columnheader", { name: "Size" })).toBeVisible();

  await component.getByRole("button", { name: "Answer" }).click();

  await expect(component.getByText("The section's content")).toBeVisible();
  await expect(skeleton).toBeHidden();
});

test("a refused read shows the section's failure, and retrying reads again", async ({ mount }) => {
  const component = await mount("components/SectionBoundary/Section");

  await component.getByRole("button", { name: "Refuse" }).click();
  await expect(component.getByText("The section is unavailable")).toBeVisible();

  await component.getByRole("button", { name: "Retry" }).click();
  await expect(component.getByRole("rowgroup", { name: "Loading" })).toBeVisible();

  await component.getByRole("button", { name: "Answer" }).click();
  await expect(component.getByText("The section's content")).toBeVisible();
});
