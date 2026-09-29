import { expect, test } from "@playwright/test";

import { type SignedIn } from "../../src/layouts/navigation/UserMenuContent.story";

// The panel is not portalled, so unlike a MUI Menu or Popover everything here is inside the
// mounted root and is addressed through `component`.

test.describe("the anchored panel", () => {
  test("an outside click closes the panel and still reaches what was clicked", async ({
    mount,
  }) => {
    const component = await mount("layouts/navigation/AnchoredMenuPanel/Anchored");

    await component.getByRole("button", { name: "Account" }).click();
    await expect(component.getByRole("region", { name: "Account menu" })).toBeVisible();

    await component.getByRole("button", { name: "Elsewhere" }).click();

    // Both halves matter: a Popper would fail the first, a Popover the second.
    await expect(component.getByRole("region", { name: "Account menu" })).toBeHidden();
    await expect(component.getByTestId("outside-clicks")).toHaveValue("1");
  });

  test("a click inside the panel is handled and leaves it open", async ({ mount }) => {
    const component = await mount("layouts/navigation/AnchoredMenuPanel/Anchored");

    await component.getByRole("button", { name: "Account" }).click();
    await component.getByRole("button", { name: "Inside" }).click();

    await expect(component.getByTestId("inside-clicks")).toHaveValue("1");
    await expect(component.getByRole("region", { name: "Account menu" })).toBeVisible();
  });

  test("Escape closes the panel without clicking anything", async ({ mount, page }) => {
    const component = await mount("layouts/navigation/AnchoredMenuPanel/Anchored");

    await component.getByRole("button", { name: "Account" }).click();
    await page.keyboard.press("Escape");

    await expect(component.getByRole("region", { name: "Account menu" })).toBeHidden();
    await expect(component.getByTestId("outside-clicks")).toHaveValue("0");
  });
});

test.describe("the account menu contents", () => {
  test("leads with the unread count and names the caller and their roles", async ({ mount }) => {
    const component = await mount<typeof SignedIn>("navigation/UserMenuContent/SignedIn", {
      unreadCount: 7,
    });

    await expect(component).toContainText("7");
    await expect(component).toContainText("new events since you last looked");
    await expect(component).toContainText("odudgeon");
    await expect(component).toContainText("data-manager-admin");
    await expect(component).toContainText("account-server-admin");
  });

  test("a single unread event is counted in the singular", async ({ mount }) => {
    const component = await mount<typeof SignedIn>("navigation/UserMenuContent/SignedIn", {
      unreadCount: 1,
    });

    await expect(component).toContainText("new event since you last looked");
  });

  test("the event stream toggle reports the state it will move to", async ({ mount }) => {
    const component = await mount("navigation/UserMenuContent/SignedIn");

    await component.getByRole("button", { name: "Show event stream" }).click();

    await expect(component.getByTestId("toggles")).toHaveValue("1");
    await expect(component.getByTestId("sidebar-open")).toHaveValue("true");
    await expect(component.getByRole("button", { name: "Hide event stream" })).toBeVisible();
  });

  test("a role too long for the panel is clipped rather than run under sign out", async ({
    mount,
  }) => {
    const component = await mount<typeof SignedIn>("navigation/UserMenuContent/SignedIn", {
      asRole: "account-server-organisation-administrator-with-a-very-long-name",
      dmRole: "data-manager-project-editor-with-an-equally-unreasonable-name",
    });

    const role = component.getByText(
      "data-manager-project-editor-with-an-equally-unreasonable-name",
    );
    const signOut = component.getByRole("button", { name: "Logout" });

    const roleBox = await role.boundingBox();
    const signOutBox = await signOut.boundingBox();
    if (!roleBox || !signOutBox) {
      throw new Error("The role text and the sign-out button must both be laid out");
    }

    // The text is clipped, so it stops before the button rather than sliding underneath it.
    expect(roleBox.x + roleBox.width).toBeLessThanOrEqual(signOutBox.x);
  });

  test("without a sidebar to open the stream is carried inline instead", async ({ mount }) => {
    const component = await mount<typeof SignedIn>("navigation/UserMenuContent/SignedIn", {
      isSidebarAvailable: false,
    });

    await expect(component.getByRole("button", { name: "Show event stream" })).toBeHidden();
    await expect(component).toContainText("Inline event stream");
  });

  test("the theme in use is the one shown as pressed", async ({ mount }) => {
    const component = await mount("navigation/UserMenuContent/SignedIn");

    const dark = component.getByRole("button", { name: "Dark" });
    await dark.click();

    await expect(dark).toHaveAttribute("aria-pressed", "true");
    await expect(component.getByRole("button", { name: "Light" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("a signed-out caller is offered a way in, and the theme, which is not an account setting", async ({
    mount,
  }) => {
    const component = await mount("navigation/UserMenuContent/SignedOut");

    await expect(component.getByRole("button", { name: "Login" })).toBeVisible();
    await expect(component.getByRole("button", { name: "Dark" })).toBeVisible();
    await expect(component.getByRole("button", { name: "Logout" })).toBeHidden();
  });

  test("a session that could not be read says so", async ({ mount }) => {
    const component = await mount("navigation/UserMenuContent/Failed");

    await expect(component.getByRole("alert")).toContainText("Your session has expired");
  });
});
