import { expect, test } from "@playwright/test";

import { prevailingRole } from "../../src/hooks/useIsAuthorized";

// The account server roles, ordered weakest first, as `AS_ROLES` builds them from the environment.
const asRoles = ["as-evaluator", "as-user", "as-admin"];

test.describe("prevailing account server role", () => {
  test("answers the strongest role held, not the first one listed", () => {
    // An admin also holds the user role; the banner must still recognise the account as an admin.
    expect(prevailingRole(["as-user", "as-admin"], asRoles)).toBe("as-admin");
    expect(prevailingRole(["as-evaluator", "as-user"], asRoles)).toBe("as-user");
    expect(prevailingRole(["as-evaluator"], asRoles)).toBe("as-evaluator");
  });

  test("answers nothing when no known role is held", () => {
    expect(prevailingRole(["dm-user"], asRoles)).toBeUndefined();
    expect(prevailingRole([], asRoles)).toBeUndefined();
    expect(prevailingRole(undefined, asRoles)).toBeUndefined();
  });
});
