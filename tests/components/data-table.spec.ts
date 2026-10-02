import { expect, test } from "@playwright/test";

test("a listing longer than a page states its size and reaches the rest", async ({ mount }) => {
  const component = await mount("DataTable/Listing");

  await expect(component.getByText("1–100 of 150")).toBeVisible();
  await expect(component.getByRole("cell", { name: "entry-101", exact: true })).toBeHidden();

  await component.getByRole("button", { name: "Go to next page" }).click();

  await expect(component.getByText("101–150 of 150")).toBeVisible();
  await expect(component.getByRole("cell", { name: "entry-101", exact: true })).toBeVisible();
});

test("an expanded row keeps its sub rows on its own page", async ({ mount }) => {
  const component = await mount("DataTable/Listing");

  await component.getByRole("row", { name: "entry-100" }).getByRole("button").click();

  await expect(component.getByRole("cell", { name: "entry-100.schema.json" })).toBeVisible();
  await expect(component.getByText("1–100 of 150")).toBeVisible();
});

test("selecting from the heading selects exactly the rows on this page", async ({ mount }) => {
  const component = await mount("DataTable/Listing");

  await component.getByRole("columnheader").getByRole("checkbox").check();

  await expect(component.getByTestId("selected")).toHaveValue("100");

  await component.getByRole("button", { name: "Go to next page" }).click();

  await expect(component.getByRole("columnheader").getByRole("checkbox")).not.toBeChecked();
  await expect(
    component.getByRole("row", { name: "entry-101" }).getByRole("checkbox"),
  ).not.toBeChecked();
});

test("a new search starts from the first page with nothing selected", async ({ mount }) => {
  const component = await mount("DataTable/Listing");

  await component.getByRole("button", { name: "Go to next page" }).click();
  await component.getByRole("columnheader").getByRole("checkbox").check();
  await expect(component.getByTestId("selected")).toHaveValue("50");

  await component.getByRole("textbox", { name: "search" }).fill("entry-1");

  await expect(component.getByTestId("selected")).toHaveValue("0");
  await expect(component.getByText(/^1–/u)).toBeVisible();
});
