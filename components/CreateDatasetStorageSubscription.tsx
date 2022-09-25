import { useMemo } from "react";
import { useQueryClient } from "react-query";

import type { AsError, UnitDetail } from "@squonk/account-server-client";
import {
  getGetProductsQueryKey,
  useCreateUnitProduct,
  useGetProductDefaultStorageCost,
} from "@squonk/account-server-client/product";

import { Box, Button } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import { Field, Form, Formik } from "formik";
import { TextField } from "formik-mui";
import * as yup from "yup";

import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { getErrorMessage } from "../utils/next/orvalError";

export interface CreateDatasetStorageSubscriptionProps {
  unit: UnitDetail;
}

const initialValues = {
  allowance: 1000,
  billingDay: 1,
  name: "Dataset Storage",
};

// TODO: write a custom formatter for Squonk coins
const formatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export const CreateDatasetStorageSubscription = ({
  unit,
}: CreateDatasetStorageSubscriptionProps) => {
  const { mutateAsync: createProduct } = useCreateUnitProduct();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<AsError>();
  const queryClient = useQueryClient();
  const { data } = useGetProductDefaultStorageCost();
  const cost = data?.default_storage_cost.cost;
  const costNumber = useMemo(() => {
    if (typeof cost === "string") {
      return Number.parseFloat(cost);
    }
  }, [cost]);
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={yup.object().shape({
        name: yup.string().trim().required("A name is required"),
        limit: yup.number().min(1).integer().required("A limit is required"),
        allowance: yup.number().min(1).integer().required("An allowance is required"),
        billingDay: yup.number().min(1).max(28).integer().required("A billing day is required"),
      })}
      onSubmit={async ({ allowance, billingDay, name }) => {
        try {
          await createProduct({
            unitId: unit.id,
            data: {
              allowance,
              billing_day: billingDay,
              limit: allowance, // TODO: we will implement this properly later
              name,
              type: "DATA_MANAGER_STORAGE_SUBSCRIPTION",
            },
          });
          enqueueSnackbar("Created product", { variant: "success" });
          queryClient.invalidateQueries(getGetProductsQueryKey());
        } catch (error) {
          enqueueError(getErrorMessage(error));
          captureException(error);
        }
      }}
    >
      {({ submitForm, isSubmitting, isValid, values }) => {
        return (
          <Form>
            <Box alignItems="baseline" display="flex" flexWrap="wrap" gap={2}>
              <Field
                autoFocus
                component={TextField}
                label="Name"
                name="name"
                sx={{ maxWidth: 150 }}
              />
              <Field
                component={TextField}
                label="Billing Day"
                max={28}
                min={1}
                name="billingDay"
                sx={{ maxWidth: 80 }}
                type="number"
              />
              <Field
                component={TextField}
                label="Allowance"
                min={1}
                name="allowance"
                sx={{ maxWidth: 100 }}
                type="number"
              />
              {costNumber && (
                <span>Cost: {formatter.format(costNumber * values.allowance).slice(1)}C</span>
              )}
              {/* {JSON.stringify(data?.default_storage_cost)} */}
              <Button disabled={isSubmitting || !isValid} onClick={submitForm}>
                Create
              </Button>
            </Box>
          </Form>
        );
      }}
    </Formik>
  );
};
