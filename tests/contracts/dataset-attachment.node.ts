import {
  type OrganisationAllDetail,
  type OrganisationUnitsGetResponse,
} from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

import { expect, test } from "@playwright/test";

import {
  attachmentTargetLabel,
  attachmentTaskKey,
  datasetAttachmentFailureMessage,
  type DatasetAttachmentInput,
  eligibleAttachmentTargets,
  resolveDatasetAttachment,
} from "../../src/datasets/attachment";
import { evaluateDatasetAttachmentCapability } from "../../src/datasets/capabilities";
import { DatasetTaskError, DatasetTaskPollingError } from "../../src/datasets/mutations";

const caller = "caller@example.org";
const colleague = "colleague@example.org";

const acceptanceUnit = "unit-11111111-1111-4111-8111-111111111111";
const screeningUnit = "unit-22222222-2222-4222-8222-222222222222";
const acceptanceOrganisation = "org-11111111-1111-4111-8111-111111111111";
const partnerOrganisation = "org-22222222-2222-4222-8222-222222222222";

const project = (
  projectId: string,
  name: string,
  roles: Partial<Pick<ProjectDetail, "administrators" | "editors" | "observers">> = {},
  ancestry: Partial<Pick<ProjectDetail, "organisation_id" | "unit_id">> = {},
): ProjectDetail => ({
  administrators: [],
  created: "2026-01-02T03:04:05Z",
  creator: caller,
  editors: [],
  name,
  observers: [],
  organisation_id: acceptanceOrganisation,
  private: true,
  project_id: projectId,
  size: 0,
  unit_id: acceptanceUnit,
  ...roles,
  ...ancestry,
});

const organisation = (id: string, name: string): OrganisationAllDetail => ({
  caller_is_member: true,
  created: "2026-01-02T03:04:05Z",
  default_product_privacy: "DEFAULT_PRIVATE",
  id,
  name,
  private: true,
  users: [],
});

const unitGroup = (
  organisationId: string,
  organisationName: string,
  units: { callerIsMember?: boolean; id: string; name: string }[],
): OrganisationUnitsGetResponse => ({
  count: units.length,
  organisation: organisation(organisationId, organisationName),
  units: units.map(({ callerIsMember = true, id, name }) => ({
    billing_day: 1,
    caller_is_member: callerIsMember,
    created: "2026-01-02T03:04:05Z",
    default_product_privacy: "DEFAULT_PRIVATE",
    id,
    name,
    owner_id: caller,
    private: true,
    users: [],
  })),
});

const unitGroups = [
  unitGroup(acceptanceOrganisation, "Acceptance Organisation", [
    { id: acceptanceUnit, name: "Acceptance Unit" },
    { callerIsMember: false, id: screeningUnit, name: "Screening Unit" },
  ]),
];

// The organisation an attachment target belongs to is named by the organisation index, which lists
// organisations the unit index need not group any unit under.
const organisations = [
  organisation(acceptanceOrganisation, "Acceptance Organisation"),
  organisation(partnerOrganisation, "Partner Organisation"),
];

const editableProjects = [
  project("project-11111111-1111-4111-8111-111111111111", "Acceptance Project", {
    editors: [caller],
  }),
  project(
    "project-22222222-2222-4222-8222-222222222222",
    "Partner Project",
    { administrators: [caller] },
    { organisation_id: partnerOrganisation },
  ),
  project(
    "project-33333333-3333-4333-8333-333333333333",
    "Shared Project",
    { editors: [caller] },
    { unit_id: screeningUnit },
  ),
  project("project-44444444-4444-4444-8444-444444444444", "Shared Project", { editors: [caller] }),
  project("project-55555555-5555-4555-8555-555555555555", "Screening Project", {
    editors: [colleague],
    observers: [caller],
  }),
];

const targets = eligibleAttachmentTargets({
  caller: { username: caller },
  organisations,
  projects: editableProjects,
  unitGroups,
});

const attachmentInput = (
  overrides: Partial<DatasetAttachmentInput> = {},
): DatasetAttachmentInput => ({
  compress: false,
  datasetId: "dataset-11111111-1111-4111-8111-111111111111",
  datasetVersion: 1,
  immutable: true,
  path: "/inputs",
  targetProjectId: "project-22222222-2222-4222-8222-222222222222",
  type: "chemical/x-mdl-sdfile",
  ...overrides,
});

const httpFailure = (status: number) => ({ isAxiosError: true, response: { status } });

/** The generated request one set of entered choices resolves to, or a failure naming its refusal. */
const requestFor = (overrides: Partial<DatasetAttachmentInput> = {}) => {
  const resolution = resolveDatasetAttachment(attachmentInput(overrides), targets);
  if (resolution.kind !== "attach") {
    throw new Error(`the fixture attachment was refused: ${resolution.reason}`);
  }
  return resolution.request;
};

test.describe("Dataset attachment targets", () => {
  test("every project the caller can edit is eligible, whatever unit or organisation holds it", () => {
    expect(targets.map(({ projectName }) => projectName)).toEqual([
      "Acceptance Project",
      "Partner Project",
      "Shared Project",
      "Shared Project",
    ]);
    // Membership of the unit that would be billed is never consulted: the Screening Unit project is
    // offered although the caller is not a member of that unit.
    expect(targets.map(({ unitName }) => unitName)).toContain("Screening Unit");
    expect(targets.map(({ organisationName }) => organisationName)).toContain(
      "Partner Organisation",
    );
  });

  test("an observer-only project and an unconfirmed caller offer nothing", () => {
    expect(targets.map(({ projectName }) => projectName)).not.toContain("Screening Project");
    expect(
      eligibleAttachmentTargets({
        caller: {},
        organisations,
        projects: editableProjects,
        unitGroups,
      }),
    ).toHaveLength(0);
  });

  test("duplicate project names are told apart by unit and organisation", () => {
    const shared = targets.filter(({ projectName }) => projectName === "Shared Project");
    expect(shared.map((target) => attachmentTargetLabel(target))).toEqual([
      "Shared Project — Acceptance Unit, Acceptance Organisation",
      "Shared Project — Screening Unit, Acceptance Organisation",
    ]);
  });

  test("ancestry the caller cannot read degrades to identity rather than to nothing", () => {
    const unreadable = eligibleAttachmentTargets({
      caller: { username: caller },
      organisations: [],
      projects: [editableProjects[1]],
      unitGroups: [],
    });
    expect(attachmentTargetLabel(unreadable[0])).toBe(
      `Partner Project — ${acceptanceUnit}, ${partnerOrganisation}`,
    );
    const undeclared = eligibleAttachmentTargets({
      caller: { username: caller },
      organisations: [],
      projects: [{ ...editableProjects[0], organisation_id: undefined, unit_id: undefined }],
      unitGroups: [],
    });
    expect(attachmentTargetLabel(undeclared[0])).toBe(
      "Acceptance Project — Unknown unit, Unknown organisation",
    );
  });
});

test.describe("Dataset attachment capability", () => {
  test("the action stays visible and states why it cannot be used", () => {
    expect(evaluateDatasetAttachmentCapability({ eligibleTargetCount: targets.length })).toEqual({
      status: "enabled",
    });
    expect(evaluateDatasetAttachmentCapability({ eligibleTargetCount: 0 })).toEqual({
      reason:
        "You must be an editor or administrator of a project to attach a dataset. Ask a project administrator to add you to one.",
      status: "disabled",
    });
    expect(
      evaluateDatasetAttachmentCapability({ eligibleTargetCount: 4, freshness: "stale" }),
    ).toEqual({ reason: "Project membership is still being confirmed.", status: "disabled" });
  });
});

test.describe("Dataset attachment command input", () => {
  test("an explicit eligible target and its entered options reach the generated request", () => {
    const resolution = resolveDatasetAttachment(
      attachmentInput({ compress: true, immutable: false }),
      targets,
    );
    expect(resolution).toEqual({
      kind: "attach",
      path: "/inputs",
      request: {
        as_type: "chemical/x-mdl-sdfile",
        compress: true,
        dataset_id: "dataset-11111111-1111-4111-8111-111111111111",
        dataset_version: 1,
        immutable: false,
        path: "/inputs",
        project_id: "project-22222222-2222-4222-8222-222222222222",
      },
      target: targets.find(({ projectName }) => projectName === "Partner Project"),
    });
  });

  test("a blank destination is the project root and an unusable one is refused", () => {
    const root = resolveDatasetAttachment(attachmentInput({ path: "  " }), targets);
    expect(root.kind === "attach" && root.request.path).toBe("/");
    expect(resolveDatasetAttachment(attachmentInput({ path: "inputs" }), targets)).toEqual({
      kind: "none",
      reason: "Enter a path that names a directory in the project, such as /inputs.",
    });
    expect(resolveDatasetAttachment(attachmentInput({ path: "/inputs/../etc" }), targets)).toEqual({
      kind: "none",
      reason: "Enter a path that names a directory in the project, such as /inputs.",
    });
  });

  test("a target that is not eligible and a missing type are never sent", () => {
    expect(resolveDatasetAttachment(attachmentInput({ targetProjectId: "" }), targets)).toEqual({
      kind: "none",
      reason: "Choose a project to attach this dataset version to.",
    });
    expect(
      resolveDatasetAttachment(
        attachmentInput({ targetProjectId: "project-55555555-5555-4555-8555-555555555555" }),
        targets,
      ),
    ).toEqual({ kind: "none", reason: "Choose a project to attach this dataset version to." });
    expect(resolveDatasetAttachment(attachmentInput({ type: " " }), targets)).toEqual({
      kind: "none",
      reason: "Choose the file type this dataset version will be attached as.",
    });
  });

  test("an accepted attachment is identified by everything that decides where it lands", () => {
    const key = attachmentTaskKey(requestFor());
    // The same request is the same accepted work, so a retry can reuse its task; anything that
    // would put a different file in the project is different work and must be sent again.
    expect(attachmentTaskKey(requestFor())).toBe(key);
    expect(attachmentTaskKey(requestFor({ compress: true }))).not.toBe(key);
    expect(attachmentTaskKey(requestFor({ immutable: false }))).not.toBe(key);
    expect(attachmentTaskKey(requestFor({ type: "text/csv" }))).not.toBe(key);
    expect(attachmentTaskKey(requestFor({ path: "/" }))).not.toBe(key);
    expect(
      attachmentTaskKey(
        requestFor({ targetProjectId: "project-11111111-1111-4111-8111-111111111111" }),
      ),
    ).not.toBe(key);
    expect(attachmentTaskKey(requestFor({ datasetVersion: 2 }))).not.toBe(key);
  });
});

test.describe("Dataset attachment failure reporting", () => {
  const scope = {
    datasetId: "dataset-11111111-1111-4111-8111-111111111111",
    datasetVersion: 1,
    targetName: "Partner Project",
  };

  test("a rejection, a processing failure, and a transient failure each keep the entered choices", () => {
    expect(datasetAttachmentFailureMessage(httpFailure(403), scope)).toBe(
      `You are not allowed to attach dataset ${scope.datasetId} version 1 to Partner Project. Nothing was attached and your choices are unchanged.`,
    );
    expect(datasetAttachmentFailureMessage(httpFailure(503), scope)).toBe(
      `Could not attach dataset ${scope.datasetId} version 1 to Partner Project. Nothing was attached and your choices are unchanged; retry is available.`,
    );
    expect(
      datasetAttachmentFailureMessage(
        new DatasetTaskError("Dataset attachment task failed with exit code 5.", "task-1"),
        scope,
      ),
    ).toBe(
      "Dataset attachment task failed with exit code 5. Task task-1. Nothing was attached to Partner Project; retry is available.",
    );
    expect(
      datasetAttachmentFailureMessage(
        new DatasetTaskPollingError("Dataset attachment is still in progress.", "task-1"),
        scope,
      ),
    ).toBe(
      "Dataset attachment is still in progress. Task task-1. Nothing was attached to Partner Project; retry is available.",
    );
  });

  test("a fact this client cannot classify is left to the transport's own report", () => {
    expect(
      datasetAttachmentFailureMessage(new Error("nothing to classify"), scope),
    ).toBeUndefined();
  });
});
