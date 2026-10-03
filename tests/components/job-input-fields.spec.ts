import { expect, test } from "@playwright/test";

test("keeps the browsed directory when moving to the next input", async ({ mount }) => {
  const component = await mount("runCards/JobCard/JobInputFields/TwoFileInputs");

  const selectButtons = component.getByRole("button", { name: "Select file" });
  await selectButtons.first().click();
  await component.getByText("ligands", { exact: true }).first().click();
  await selectButtons.first().click();

  const files = component.getByText("a.sdf");
  await expect(files).toHaveCount(2);
  await expect(files.nth(0)).toBeVisible();
  await expect(files.nth(1)).toBeVisible();
});
