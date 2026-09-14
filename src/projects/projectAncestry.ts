import {
  type OrganisationAllDetail,
  type ProductDmProjectTier,
  type ProductDmStorage,
  type ProductUnitGetResponse,
  type UnitAllDetail,
} from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

import { resolveSectionReadState } from "./sectionReads";

export type LinkedProject = ProjectDetail & { product_id: string };

/**
 * Where a project sits in the Account Server: the subscription that pays for it, and the unit and
 * organisation that subscription belongs to. All three come from the one product read, so they are
 * held together — a project either has the whole of its ancestry or none of it.
 */
export type ProjectAncestry = {
  organisation: OrganisationAllDetail;
  product: ProductDmProjectTier | ProductDmStorage;
  unit: UnitAllDetail;
};

/**
 * What the project's linked product read established. A project the caller can read is not a
 * project whose subscription they may read: the Account Server refuses a product to everyone
 * outside its unit, so a public project seen by a non-member resolves without an ancestry. That is
 * an ordinary state of a usable project, not a failure of the project itself, and it is told apart
 * from a product read that merely failed, which is worth retrying.
 */
export type ProjectAncestryRead =
  { kind: "unavailable" | "unreadable" } | (ProjectAncestry & { kind: "resolved" });

/** The ancestry a read established, or nothing where it established none. */
export const resolvedAncestry = (read: ProjectAncestryRead): ProjectAncestry | undefined =>
  read.kind === "resolved" ? read : undefined;

export const requireLinkedProject = (project: ProjectDetail): LinkedProject => {
  if (!project.product_id) {
    throw new Error(`Project ${project.project_id} does not identify a linked product`);
  }
  return project as LinkedProject;
};

export const resolveProjectAncestry = (
  project: LinkedProject,
  response: ProductUnitGetResponse,
): ProjectAncestry => {
  const product = response.product;
  if (
    product.product.id !== project.product_id ||
    (project.organisation_id && project.organisation_id !== product.organisation.id) ||
    (project.unit_id && project.unit_id !== product.unit.id) ||
    ("claim" in product && product.claim && product.claim.id !== project.project_id)
  ) {
    throw new Error(`Project ${project.project_id} does not match its linked product ancestry`);
  }

  return { organisation: product.organisation, product, unit: product.unit };
};

/**
 * What one settled product read established for a project. A project that names no subscription at
 * all has none to read, so it is reported as an absent ancestry rather than as a broken project;
 * every other outcome is the read's own, told apart exactly as a section's reads are, so a refusal
 * is stated and a transient failure keeps its retry.
 *
 * The caller decides when the read has settled: a pending read has established nothing and must
 * not be described here.
 */
export const readProjectAncestry = (
  project: ProjectDetail,
  read: { data: ProductUnitGetResponse | undefined; error: unknown },
): ProjectAncestryRead => {
  if (!project.product_id) {
    return { kind: "unavailable" };
  }
  if (read.data) {
    return { kind: "resolved", ...resolveProjectAncestry(project as LinkedProject, read.data) };
  }
  return resolveSectionReadState(read.error).kind === "unavailable"
    ? { kind: "unavailable" }
    : { kind: "unreadable" };
};

/**
 * A project's container, named where the ancestry names it and identified where it does not. A
 * project always has containers, so an unnamed one still says which container it is: an identifier
 * the caller can quote is worth more than a blank.
 */
export const projectContainerLabel = (
  name: string | undefined,
  containerId: string | undefined,
  kind: "Organisation" | "Unit",
) =>
  name ??
  (containerId ? `${kind} ${containerId}` : `Unknown containing ${kind.toLocaleLowerCase()}`);
