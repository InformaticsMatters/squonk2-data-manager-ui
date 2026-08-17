import {
  type OrganisationAllDetail,
  type OrganisationUnitsGetResponse,
} from "@/api/account-server";
import { type FilePostBodyBody, type ProjectDetail } from "@/api/data-manager";

import {
  classifyTransportFailure,
  isTransientTransportFailure,
} from "../api/runtime/classifyTransportFailure";
import { canonicalFilesystemPath, filesystemRoot } from "../projects/fileFacts";
import { noErrorInformation } from "../utils/next/orvalError";
import { DatasetTaskError, DatasetTaskPollingError } from "./mutations";

/**
 * One project a dataset version may be attached to, named the way a caller has to read it: the
 * project, the unit that holds it, and the organisation that owns the unit. Two projects can share
 * a name, so the ancestry is part of the target rather than a detail looked up later.
 */
export type AttachmentTarget = {
  organisationName: string;
  projectId: string;
  projectName: string;
  unitName: string;
};

export const attachmentTargetLabel = ({
  organisationName,
  projectName,
  unitName,
}: AttachmentTarget): string => `${projectName} — ${unitName}, ${organisationName}`;

/**
 * Which projects this dataset version may be attached to.
 *
 * The Data Manager requires an editor of the project, so the project's own membership lists are the
 * whole test and every organisation and unit the caller can edit in is offered. A billing unit is
 * not consulted at all: attaching bills the project that already exists rather than choosing where
 * to spend, so the unit a dataset was uploaded to restricts nothing here. Ancestry names come from
 * the generated unit index where it has them and degrade to the project's own declared identity
 * where it does not, because a target the caller cannot tell apart is worse than an ugly one.
 */
export const eligibleAttachmentTargets = ({
  caller,
  organisations,
  projects,
  unitGroups,
}: {
  caller: { username?: string };
  organisations: readonly OrganisationAllDetail[];
  projects: readonly ProjectDetail[];
  unitGroups: readonly OrganisationUnitsGetResponse[];
}): AttachmentTarget[] => {
  const { username } = caller;
  if (!username) {
    return [];
  }
  const unitNames = new Map(
    unitGroups.flatMap(({ units }) => units.map((unit) => [unit.id, unit.name] as const)),
  );
  const organisationNames = new Map(
    organisations.map((organisation) => [organisation.id, organisation.name] as const),
  );
  /** The name an index gave this resource, its own identity if the index has none, or neither. */
  const nameOf = (names: Map<string, string>, id: string | undefined, undeclared: string) =>
    id === undefined ? undeclared : (names.get(id) ?? id);

  return projects
    .filter(
      (project) => project.editors.includes(username) || project.administrators.includes(username),
    )
    .map((project) => ({
      organisationName: nameOf(organisationNames, project.organisation_id, "Unknown organisation"),
      projectId: project.project_id,
      projectName: project.name,
      unitName: nameOf(unitNames, project.unit_id, "Unknown unit"),
    }))
    .toSorted((left, right) =>
      attachmentTargetLabel(left).localeCompare(attachmentTargetLabel(right)),
    );
};

/**
 * The directory an attachment lands in. A blank destination is the project root, exactly as the
 * generated argument's own default, and anything that cannot name a directory is refused rather
 * than repaired. Files owns what a project path is, so this asks that owner rather than spelling
 * out a second rule.
 */
export const attachmentDestinationPath = (value: string): string | null => {
  const entered = value.trim();
  return entered === "" ? filesystemRoot : canonicalFilesystemPath(entered);
};

/** What a destination that cannot name a directory is told, wherever it is entered or refused. */
export const attachmentDestinationRequirement =
  "Enter a path that names a directory in the project, such as /inputs.";

export type DatasetAttachmentInput = {
  compress: boolean;
  datasetId: string;
  datasetVersion: number;
  immutable: boolean;
  path: string;
  targetProjectId: string;
  type: string;
};

export type DatasetAttachmentResolution =
  | { kind: "attach"; path: string; request: FilePostBodyBody; target: AttachmentTarget }
  | { kind: "none"; reason: string };

/**
 * Shapes one attachment into the generated request, or says why it cannot be sent.
 *
 * The target is always an explicit choice checked against the eligible ones, so nothing defaults to
 * whichever project happened to be listed first or was last visited, and a project the caller may
 * not edit never reaches the Data Manager.
 */
export const resolveDatasetAttachment = (
  input: DatasetAttachmentInput,
  targets: readonly AttachmentTarget[],
): DatasetAttachmentResolution => {
  const target = targets.find(({ projectId }) => projectId === input.targetProjectId);
  if (!target) {
    return { kind: "none", reason: "Choose a project to attach this dataset version to." };
  }
  const asType = input.type.trim();
  if (asType === "") {
    return {
      kind: "none",
      reason: "Choose the file type this dataset version will be attached as.",
    };
  }
  const path = attachmentDestinationPath(input.path);
  if (path === null) {
    return { kind: "none", reason: attachmentDestinationRequirement };
  }
  return {
    kind: "attach",
    path,
    request: {
      as_type: asType,
      compress: input.compress,
      dataset_id: input.datasetId,
      dataset_version: input.datasetVersion,
      immutable: input.immutable,
      path,
      project_id: target.projectId,
    },
    target,
  };
};

/**
 * The identity of one accepted attachment: everything the request would have the Data Manager do.
 * A retry of exactly this work reuses the task already issued, so a failure this client could not
 * interpret never attaches the same version twice; changing any choice — the type it is attached
 * as, or whether it is compressed or immutable — asks for a different file and is therefore
 * different work that must be sent.
 */
export const attachmentTaskKey = ({
  as_type,
  compress,
  dataset_id,
  dataset_version,
  immutable,
  path,
  project_id,
}: FilePostBodyBody): string =>
  JSON.stringify([
    dataset_id,
    dataset_version,
    project_id,
    path ?? filesystemRoot,
    as_type,
    compress ?? false,
    immutable ?? false,
  ]);

/**
 * What every attachment failure assures, because none of these outcomes touches the dataset version
 * on screen or the choices entered beside it. It is written once so no message can drift from it.
 */
const nothingAttached = "Nothing was attached and your choices are unchanged";

/**
 * What a failed attachment says. Each states what became of the work, because the dataset version
 * on screen and the choices entered beside it are untouched by all of these outcomes: a task the
 * Data Manager settled against the attachment attached nothing, while a task this client merely
 * stopped waiting on may yet attach something and is never reported as having failed to. A fact
 * this client cannot classify says nothing here and is left to
 * {@link unclassifiedAttachmentFailureMessage} and the transport's own report.
 */
export const datasetAttachmentFailureMessage = (
  error: unknown,
  {
    datasetId,
    datasetVersion,
    targetName,
  }: { datasetId: string; datasetVersion: number; targetName: string },
): string | undefined => {
  // Polling stopped; the task did not. Only a task the Data Manager settled says the work is over,
  // so a task still running is never reported as work that did not happen — and the retry offered
  // resumes waiting on that same accepted task rather than asking for the file a second time.
  if (error instanceof DatasetTaskPollingError) {
    return `${error.message} Task ${error.taskId}. It may still finish attaching to ${targetName}; retry to keep waiting rather than attaching a second copy.`;
  }
  if (error instanceof DatasetTaskError) {
    return `${error.message} Task ${error.taskId}. Nothing was attached to ${targetName}; retry is available.`;
  }
  if (classifyTransportFailure(error).kind === "forbidden") {
    return `You are not allowed to attach dataset ${datasetId} version ${datasetVersion} to ${targetName}. ${nothingAttached}.`;
  }
  if (isTransientTransportFailure(error)) {
    return `Could not attach dataset ${datasetId} version ${datasetVersion} to ${targetName}. ${nothingAttached}; retry is available.`;
  }
  return undefined;
};

/**
 * What a failure this client could not classify says, given the transport's own account of it.
 *
 * That account is the only account of such a failure there is, so it is what the caller reads
 * beside the form they entered rather than something generic standing in front of it. A failure
 * that reported nothing at all — or only the placeholder that stands for nothing — still says the
 * one thing every attachment failure says.
 */
export const unclassifiedAttachmentFailureMessage = (
  reported: string | null | undefined,
): string => {
  const account = reported?.trim();
  if (!account || account === noErrorInformation) {
    return `The Data Manager refused this attachment. ${nothingAttached}.`;
  }
  const sentence = ".!?".includes(account.slice(-1)) ? account : `${account}.`;
  return `${sentence} ${nothingAttached}.`;
};
