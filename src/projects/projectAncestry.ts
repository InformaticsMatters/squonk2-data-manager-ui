import { type ProductUnitGetResponse } from "@/api/account-server";
import { type ProjectDetail } from "@/api/data-manager";

export type LinkedProject = ProjectDetail & { product_id: string };

export const requireLinkedProject = (project: ProjectDetail): LinkedProject => {
  if (!project.product_id) {
    throw new Error(`Project ${project.project_id} does not identify a linked product`);
  }
  return project as LinkedProject;
};

export const resolveProjectAncestry = (
  project: LinkedProject,
  response: ProductUnitGetResponse,
) => {
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
