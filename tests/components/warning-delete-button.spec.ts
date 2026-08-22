import { expect, test } from "@playwright/test";

import { type Customised } from "../../src/components/WarningDeleteButton.story";

// MUI renders its dialog into a portal on `document.body`, outside the gallery root, so the
// confirmation is addressed through `page` while the trigger and the story's recorded state are
// scoped to the mounted component.

test("confirming the warning runs the deletion once and closes the modal", async ({
  mount,
  page,
}) => {
  const component = await mount("components/WarningDeleteButton/Confirming");

  await component.getByRole("button", { name: "Delete" }).click();

  const modal = page.getByRole("dialog");
  await expect(modal).toContainText("This cannot be undone");

  await modal.getByRole("button", { name: "Delete" }).click();

  await expect(modal).toBeHidden();
  await expect(component.getByTestId("deletions")).toHaveValue("1");
});

test("dismissing the warning leaves the deletion unrun", async ({ mount, page }) => {
  const component = await mount("components/WarningDeleteButton/Confirming");

  await component.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(component.getByTestId("deletions")).toHaveValue("0");
});

test("a failed deletion keeps the modal open for a retry", async ({ mount, page }) => {
  const component = await mount("components/WarningDeleteButton/RetainingOnError");

  await component.getByRole("button", { name: "Delete" }).click();

  const modal = page.getByRole("dialog");
  const submit = modal.getByRole("button", { name: "Delete anyway" });

  await submit.click();
  await expect(component.getByTestId("attempts")).toHaveValue("1");
  await expect(modal).toBeVisible();

  await submit.click();
  await expect(component.getByTestId("attempts")).toHaveValue("2");
  await expect(modal).toBeVisible();
});

test("the modal presents the wording it is given", async ({ mount, page }) => {
  const component = await mount<typeof Customised>("components/WarningDeleteButton/Customised", {
    submitText: "Delete for good",
    title: "Delete unit",
  });

  await component.getByRole("button", { name: "Delete", exact: true }).click();

  const modal = page.getByRole("dialog");
  await expect(modal).toContainText("Delete unit");
  await expect(modal.getByRole("button", { name: "Delete for good" })).toBeVisible();

  // `update` re-renders the same story, so the open modal survives the prop change.
  await component.update({ submitText: "Remove", title: "Delete organisation" });

  await expect(modal).toContainText("Delete organisation");
  await expect(modal.getByRole("button", { name: "Remove" })).toBeVisible();
});
