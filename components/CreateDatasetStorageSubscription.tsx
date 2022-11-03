import type { AsError, UnitDetail } from "@squonk/account-server-client";
import {
  getGetProductsQueryKey,
  useCreateUnitProduct,
} from "@squonk/account-server-client/product";

import { Box, Button } from "@mui/material";
import { captureException } from "@sentry/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { Field, Form, Formik } from "formik";
import { TextField } from "formik-mui";
import * as yup from "yup";

import { useEnqueueError } from "../hooks/useEnqueueStackError";
import { useGetStorageCost } from "../hooks/useGetStorageCost";
import { coinsFormatter } from "../utils/app/coins";
import { getErrorMessage } from "../utils/next/orvalError";

export interface CreateDatasetStorageSubscriptionProps {
  unit: UnitDetail;
}

const initialValues = {
  allowance: 1000,
  name: "Dataset Storage",
};

export const CreateDatasetStorageSubscription = ({
  unit,
}: CreateDatasetStorageSubscriptionProps) => {
  const { mutateAsync: createProduct } = useCreateUnitProduct();
  const { enqueueError, enqueueSnackbar } = useEnqueueError<AsError>();
  const queryClient = useQueryClient();
  const cost = useGetStorageCost();
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={yup.object().shape({
        name: yup.string().trim().required("A name is required"),
        allowance: yup.number().min(1).integer().required("An allowance is required"),
      })}
      onSubmit={async ({ allowance, name }) => {
        try {
          await createProduct({
            unitId: unit.id,
            data: {
              allowance,
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
                label="Allowance"
                min={1}
                name="allowance"
                sx={{ maxWidth: 100 }}
                type="number"
              />
              {cost && (
                <span>Cost: {coinsFormatter.format(cost * values.allowance).slice(1)}C</span>
              )}
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
