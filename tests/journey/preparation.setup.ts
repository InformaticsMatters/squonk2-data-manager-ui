import {
  type ProductDmProjectTier,
  type ProductsGetResponse,
  type UnitAllDetail,
} from "@/api/account-server";
import { type ProjectDeleteResponse, type TaskGetResponse } from "@/api/data-manager";

import { expect, test as setup } from "@playwright/test";

import { passwordFor } from "../liveEnvironment";
import { journeyCollaborators, journeyUser } from "./deployment";
import { accessTokenFor, accountServer, asIdentity, dataManager } from "./services";

/**
 * A personal unit the caller does not have is the state this preparation is trying to reach, so
 * the Account Server saying so is success, not a failure to report.
 */
const alreadyAbsent = ["You do not have a Personal Unit", "The Unit does not exist"];

/** The journey user's own unit, or nothing at all — which is the state preparation is reaching. */
const readPersonalUnit = async (token: string) => {
  const response = await fetch(`${accountServer()}/personal-unit`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return response.ok ? ((await response.json()) as UnitAllDetail) : undefined;
};

const deletePersonalUnit = async (token: string) => {
  const response = await fetch(`${accountServer()}/personal-unit`, {
    headers: { authorization: `Bearer ${token}` },
    method: "DELETE",
  });
  if (response.ok) {
    return;
  }
  const body = (await response.json()) as { error?: string };
  expect(
    alreadyAbsent,
    `the personal unit could not be deleted: ${JSON.stringify(body)}`,
  ).toContain(body.error);
};

/** One authenticated read per service, which is what makes each service know the identity. */
const warmUp = async (token: string) => {
  await asIdentity(token, `${accountServer()}/organisation`);
  await asIdentity(token, `${dataManager()}/project`);
};

/** A deleted project is gone only once the Data Manager's own deletion task says so. */
const deleteProject = async (token: string, projectId: string) => {
  const { task_id: taskId } = await asIdentity<ProjectDeleteResponse>(
    token,
    `${dataManager()}/project/${projectId}`,
    { method: "DELETE" },
  );
  await expect
    .poll(
      async () =>
        (await asIdentity<TaskGetResponse>(token, `${dataManager()}/task/${taskId}`)).done,
      { message: `the Data Manager never finished deleting ${projectId}`, timeout: 300_000 },
    )
    .toBe(true);
};

/**
 * The workspace is cleared before the run rather than after it. A failed run's residue is
 * evidence, and this is what removes it; cleaning up afterwards would run cleanup code against a
 * half-broken state and destroy the evidence on the way.
 *
 * Preparation talks to the services directly, as each identity, because what the application does
 * with them is what the journey itself is there to exercise.
 */
setup("every identity is known and the journey user's workspace is empty", async () => {
  const journeyPassword = passwordFor(journeyUser);
  expect(
    journeyPassword,
    `the journey user ${journeyUser.username} needs ${journeyUser.passwordVariable} to be set`,
  ).toBeTruthy();
  expect(
    journeyCollaborators.map(({ username }) => username as string),
    "the journey user cannot also be one of its own collaborators",
  ).not.toContain(journeyUser.username);

  const journeyToken = await accessTokenFor(journeyUser.username, journeyPassword as string);

  const personalUnit = await readPersonalUnit(journeyToken);
  // Only what the journey itself makes is cleared. The deployment is shared, and a product the
  // journey user can administer somewhere else belongs to whoever made it.
  const residue = personalUnit
    ? (
        await asIdentity<ProductsGetResponse>(journeyToken, `${accountServer()}/product`)
      ).products.filter(({ unit }) => unit.id === personalUnit.id)
    : [];

  // A project holds its subscription's claim, and the Account Server will not release a
  // subscription that is still claimed, so the projects go first.
  const claimed = residue
    .filter((product): product is ProductDmProjectTier => "claim" in product)
    .map((product) => product.claim?.id)
    .filter((projectId) => projectId !== undefined);
  for (const projectId of claimed) {
    await deleteProject(journeyToken, projectId);
  }

  for (const { product } of residue) {
    await asIdentity(journeyToken, `${accountServer()}/product/${product.id}`, {
      method: "DELETE",
    });
  }

  await deletePersonalUnit(journeyToken);

  // The journey starts from a user who has nothing, which is also what its first screen claims.
  expect(await readPersonalUnit(journeyToken), "the journey user still has a personal unit").toBe(
    undefined,
  );

  // Neither service knows a user until that user has reached it, and the Data Manager offers a
  // project's membership only the users it knows. One authenticated read per service per identity
  // is what keeps a database reset behind us from breaking the journey's sharing step rather than
  // the application.
  await warmUp(journeyToken);
  for (const collaborator of journeyCollaborators) {
    const password = passwordFor(collaborator);
    const { passwordVariable, username } = collaborator;
    expect(password, `${username} needs ${passwordVariable} to be set`).toBeTruthy();
    await warmUp(await accessTokenFor(username, password as string));
  }
});
