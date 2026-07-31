import { appApiOrganisationGetOrgPathOrgIdRegExp } from "@/api/account-server/organisation/zod";
import { appApiProductGetProductPathProductIdRegExp } from "@/api/account-server/product/zod";
import { appApiUnitGetUnitPathUnitIdRegExp } from "@/api/account-server/unit/zod";
import { appApiApplicationGetApplicationPathApplicationIdRegExp } from "@/api/data-manager/application/zod";
import { appApiDatasetGetDatasetPathDatasetIdRegExp } from "@/api/data-manager/dataset/zod";
import { appApiInstanceGetInstancePathInstanceIdRegExp } from "@/api/data-manager/instance/zod";
import { appApiProjectGetProjectPathProjectIdRegExp } from "@/api/data-manager/project/zod";
import { appApiTaskGetTaskPathTaskIdRegExp } from "@/api/data-manager/task/zod";
import {
  appApiWorkflowGetRunningWorkflowPathRunningWorkflowIdRegExp,
  appApiWorkflowGetWorkflowPathWorkflowIdRegExp,
} from "@/api/data-manager/workflow/zod";

const positiveIntegerRegExp = /^[1-9]\d*$/u;

declare const routeIdBrand: unique symbol;
type RouteId<TName extends string> = string & { readonly [routeIdBrand]: TName };

export type ApplicationId = RouteId<"ApplicationId">;
export type DatasetId = RouteId<"DatasetId">;
export type InstanceId = RouteId<"InstanceId">;
export type OrganisationId = RouteId<"OrganisationId">;
export type PositiveIntegerString = RouteId<"PositiveIntegerString">;
export type ProductId = RouteId<"ProductId">;
export type ProjectId = RouteId<"ProjectId">;
export type RunningWorkflowId = RouteId<"RunningWorkflowId">;
export type TaskId = RouteId<"TaskId">;
export type UnitId = RouteId<"UnitId">;
export type WorkflowId = RouteId<"WorkflowId">;

export const isProjectId = (value: string): value is ProjectId =>
  appApiProjectGetProjectPathProjectIdRegExp.test(value);
export const isProductId = (value: string): value is ProductId =>
  appApiProductGetProductPathProductIdRegExp.test(value);
export const isTaskId = (value: string): value is TaskId =>
  appApiTaskGetTaskPathTaskIdRegExp.test(value);
export const isInstanceId = (value: string): value is InstanceId =>
  appApiInstanceGetInstancePathInstanceIdRegExp.test(value);
export const isWorkflowId = (value: string): value is WorkflowId =>
  appApiWorkflowGetWorkflowPathWorkflowIdRegExp.test(value);
export const isRunningWorkflowId = (value: string): value is RunningWorkflowId =>
  appApiWorkflowGetRunningWorkflowPathRunningWorkflowIdRegExp.test(value);
export const isDatasetId = (value: string): value is DatasetId =>
  appApiDatasetGetDatasetPathDatasetIdRegExp.test(value);
export const isApplicationId = (value: string): value is ApplicationId =>
  value.length <= 253 && appApiApplicationGetApplicationPathApplicationIdRegExp.test(value);
export const isOrganisationId = (value: string): value is OrganisationId =>
  appApiOrganisationGetOrgPathOrgIdRegExp.test(value);
export const isUnitId = (value: string): value is UnitId =>
  appApiUnitGetUnitPathUnitIdRegExp.test(value);
export const isPositiveInteger = (value: string): value is PositiveIntegerString =>
  positiveIntegerRegExp.test(value);

export const isDatasetVersion = (value: string): boolean => {
  if (!isPositiveInteger(value)) {
    return false;
  }
  return Number.isSafeInteger(Number(value));
};
