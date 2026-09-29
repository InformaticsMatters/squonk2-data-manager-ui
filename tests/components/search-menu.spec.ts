import { expect, test } from "@playwright/test";

import { type Pending } from "../../src/components/SearchMenu/SearchMenu.story";

// MUI renders the popover into a portal on `document.body`, outside the gallery root, so only the
// trigger is addressable through the mounted component. The search field, the list, the footer and
// the live region are all addressed through `page`.

test("the highlight moves through the sections as one flat list and clamps at both ends", async ({
  mount,
  page,
}) => {
  const component = await mount("SearchMenu/Sectioned");
  await component.getByRole("button", { name: "Change project" }).click();

  const search = page.getByRole("combobox", { name: "Search projects" });
  await expect(search).toBeFocused();

  const options = page.getByRole("option");
  await expect(options).toHaveCount(8);
  await expect(options.first()).toHaveAttribute("aria-selected", "true");

  // Up at the top stays at the top rather than wrapping to the bottom.
  await search.press("ArrowUp");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");

  await search.press("End");
  await expect(options.last()).toHaveAttribute("aria-selected", "true");
  // Down at the bottom stays at the bottom.
  await search.press("ArrowDown");
  await expect(options.last()).toHaveAttribute("aria-selected", "true");

  await search.press("Home");
  await expect(options.first()).toHaveAttribute("aria-selected", "true");

  // The second section starts at the third row, and the highlight crosses into it without the
  // caller having to know the boundary is there.
  await search.press("ArrowDown");
  await search.press("ArrowDown");
  await expect(options.nth(2)).toHaveAttribute("aria-selected", "true");
  await expect(options.nth(2)).toContainText("Adjuvant Study");
});

test("the highlight is carried by active-descendant while focus stays in the search field", async ({
  mount,
  page,
}) => {
  const component = await mount("SearchMenu/Sectioned");
  await component.getByRole("button", { name: "Change project" }).click();

  const search = page.getByRole("combobox", { name: "Search projects" });
  const options = page.getByRole("option");

  await search.press("ArrowDown");
  await expect(search).toBeFocused();
  await expect(search).toHaveAttribute(
    "aria-activedescendant",
    (await options.nth(1).getAttribute("id")) ?? "",
  );
});

test("Enter chooses the highlighted row and closes the menu", async ({ mount, page }) => {
  const component = await mount("SearchMenu/Sectioned");
  await component.getByRole("button", { name: "Change project" }).click();

  const search = page.getByRole("combobox", { name: "Search projects" });
  await search.press("ArrowDown");
  await search.press("Enter");

  await expect(search).toHaveCount(0);
  await expect(component.getByTestId("chosen")).toHaveValue("Assay Triage");
});

test("a narrowed list puts the highlight back at the top, so Enter opens what is highlighted", async ({
  mount,
  page,
}) => {
  const component = await mount("SearchMenu/Sectioned");
  await component.getByRole("button", { name: "Change project" }).click();

  const search = page.getByRole("combobox", { name: "Search projects" });
  await search.press("ArrowDown");
  await search.press("ArrowDown");

  await search.fill("crystal");
  const options = page.getByRole("option");
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute("aria-selected", "true");

  await search.press("Enter");
  await expect(component.getByTestId("chosen")).toHaveValue("Crystal Review");
});

test("the match count is announced through a polite live region", async ({ mount, page }) => {
  const component = await mount("SearchMenu/Sectioned");
  await component.getByRole("button", { name: "Change project" }).click();

  const matches = page.getByRole("status", { name: "Matches" });
  await expect(matches).toHaveAttribute("aria-live", "polite");
  await expect(matches).toHaveText("8 matches");

  await page.getByRole("combobox", { name: "Search projects" }).fill("crystal");
  await expect(matches).toHaveText("1 match");
});

test("each headed section is a group named by its heading", async ({ mount, page }) => {
  const component = await mount("SearchMenu/Sectioned");
  await component.getByRole("button", { name: "Change project" }).click();

  await expect(page.getByRole("group", { name: "Recent (2)" }).getByRole("option")).toHaveCount(2);
  await expect(
    page.getByRole("group", { name: "All projects (6)" }).getByRole("option"),
  ).toHaveCount(6);
});

test("the dialog declares itself modal and is described by its footer note", async ({
  mount,
  page,
}) => {
  const component = await mount("SearchMenu/Sectioned");
  await component.getByRole("button", { name: "Change project" }).click();

  const dialog = page.getByRole("dialog", { name: "Change project" });
  await expect(dialog).toHaveAttribute("aria-modal", "true");

  const described = await dialog.getAttribute("aria-describedby");
  await expect(page.locator(`#${described ?? ""}`)).toHaveText("Opens Results");
});

test("the row the caller is already on is marked apart from the keyboard highlight", async ({
  mount,
  page,
}) => {
  const component = await mount("SearchMenu/Sectioned");
  await component.getByRole("button", { name: "Change project" }).click();

  const current = page.getByRole("option", { name: /Crystal Review/u });
  // Where the caller is; not where the keyboard is. The two meanings never share one appearance.
  await expect(current).toHaveAttribute("aria-current", "true");
  await expect(current).toHaveAttribute("aria-selected", "false");
  await expect(current.getByRole("img", { name: "The project in the address bar" })).toBeVisible();

  await expect(page.getByRole("option").first()).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("option").first()).not.toHaveAttribute("aria-current", "true");
});

test("Tab closes the menu and hands the keyboard back to the trigger", async ({ mount, page }) => {
  const component = await mount("SearchMenu/Sectioned");
  const trigger = component.getByRole("button", { name: "Change project" });
  await trigger.click();

  const search = page.getByRole("combobox", { name: "Search projects" });
  await expect(search).toBeFocused();
  // Rows are not tab stops, so leaving does not mean walking every one of them.
  await search.press("Tab");

  await expect(search).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("Escape closes the menu without choosing anything", async ({ mount, page }) => {
  const component = await mount("SearchMenu/Sectioned");
  const trigger = component.getByRole("button", { name: "Change project" });
  await trigger.click();

  await page.getByRole("combobox", { name: "Search projects" }).press("Escape");

  await expect(page.getByRole("combobox", { name: "Search projects" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(component.getByTestId("chosen")).toHaveValue("");
});

test("a reopened menu starts with an empty search", async ({ mount, page }) => {
  const component = await mount("SearchMenu/Sectioned");
  const trigger = component.getByRole("button", { name: "Change project" });
  await trigger.click();

  await page.getByRole("combobox", { name: "Search projects" }).fill("crystal");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.getByRole("combobox", { name: "Search projects" }).press("Escape");

  await trigger.click();
  await expect(page.getByRole("combobox", { name: "Search projects" })).toHaveValue("");
  await expect(page.getByRole("option")).toHaveCount(8);
});

test("a list that has not answered says so, and says so no longer once it has", async ({
  mount,
  page,
}) => {
  const component = await mount<typeof Pending>("SearchMenu/Pending");
  await component.getByRole("button", { name: "Change organisation" }).click();

  await expect(page.getByText("Loading organisations…")).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(0);

  // `update` re-renders the same story, so the open menu survives the prop change.
  await component.update({ isPending: false });

  await expect(page.getByText("Loading organisations…")).toHaveCount(0);
  await expect(page.getByRole("option", { name: /Acceptance Organisation/u })).toBeVisible();
});

test("a search matching nothing names what did not match", async ({ mount, page }) => {
  const component = await mount("SearchMenu/Empty");
  await component.getByRole("button", { name: "Change project" }).click();

  await expect(page.getByText("No project matches “no such project”.")).toBeVisible();
  await expect(page.getByRole("option")).toHaveCount(0);
});

test("an unheaded section offers its rows without a group to announce", async ({ mount, page }) => {
  const component = await mount("SearchMenu/Unheaded");
  await component.getByRole("button", { name: "Change organisation" }).click();

  await expect(page.getByRole("option")).toHaveCount(3);
  await expect(page.getByRole("group")).toHaveCount(0);
  await expect(page.getByRole("option", { name: /Partner Organisation/u })).toHaveAttribute(
    "aria-current",
    "true",
  );

  await page.getByRole("combobox", { name: "Search organisations" }).fill("default");
  await expect(page.getByRole("option")).toHaveCount(1);

  await page.getByRole("option", { name: /Default Organisation/u }).click();
  await expect(component.getByTestId("chosen")).toHaveValue("org-default");
});
