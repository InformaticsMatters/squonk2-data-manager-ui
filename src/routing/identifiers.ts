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

export const isProjectId = (value: string): boolean =>
  appApiProjectGetProjectPathProjectIdRegExp.test(value);
export const isProductId = (value: string): boolean =>
  appApiProductGetProductPathProductIdRegExp.test(value);
export const isTaskId = (value: string): boolean => appApiTaskGetTaskPathTaskIdRegExp.test(value);
export const isInstanceId = (value: string): boolean =>
  appApiInstanceGetInstancePathInstanceIdRegExp.test(value);
export const isWorkflowId = (value: string): boolean =>
  appApiWorkflowGetWorkflowPathWorkflowIdRegExp.test(value);
export const isRunningWorkflowId = (value: string): boolean =>
  appApiWorkflowGetRunningWorkflowPathRunningWorkflowIdRegExp.test(value);
export const isDatasetId = (value: string): boolean =>
  appApiDatasetGetDatasetPathDatasetIdRegExp.test(value);
export const isApplicationId = (value: string): boolean =>
  value.length <= 253 && appApiApplicationGetApplicationPathApplicationIdRegExp.test(value);
export const isOrganisationId = (value: string): boolean =>
  appApiOrganisationGetOrgPathOrgIdRegExp.test(value);
export const isUnitId = (value: string): boolean => appApiUnitGetUnitPathUnitIdRegExp.test(value);
export const isPositiveInteger = (value: string): boolean => positiveIntegerRegExp.test(value);

export const isDatasetVersion = (value: string): boolean => {
  if (!isPositiveInteger(value)) {
    return false;
  }
  return Number.isSafeInteger(Number(value));
};
