import type {
  AsError,
  ProductDetail,
  UnitDetail,
  UnitProductPostBodyBodyFlavour,
} from "@squonk/account-server-client";
import {
  getGetProductsForUnitQueryKey,
  getGetProductsQueryKey,
  useCreateUnitProduct,
  useGetProductTypes,
} from "@squonk/account-server-client/product";
import type { DmError } from "@squonk/data-manager-client";
import { getGetProjectsQueryKey, useCreateProject } from "@squonk/data-manager-client/project";

import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import type { FormikConfig } from "formik";
import { Field, Form, Formik } from "formik";
import { Checkbox, TextField } from "formik-mui";
import * as yup from "yup";

import { PROJECT_SUB } from "../../constants/products";
import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useEnqueueError } from "../../hooks/useEnqueueStackError";
import type { Resolve } from "../../types";
import { formatTierString } from "../../utils/app/products";
import { getErrorMessage } from "../../utils/next/orvalError";
import type { FormikModalWrapperProps } from "../modals/FormikModalWrapper";
import { FormikModalWrapper } from "../modals/FormikModalWrapper";

export interface CreateProjectFormProps {
  modal?: Resolve<
    Pick<FormikModalWrapperProps, "id" | "title" | "submitText" | "open" | "onClose">
  >;
  unitId: UnitDetail["id"] | (() => Promise<UnitDetail["id"]>);
  product?: ProductDetail;
}

export interface Values {
  projectName: string;
  flavour: string;
  isPrivate: boolean;
}

type ProjectFormikProps = FormikConfig<Values>;

export const CreateProjectForm = ({ modal, unitId, product }: CreateProjectFormProps) => {
  const initialValues: Values = {
    projectName: "",
    flavour: product?.flavour ?? "",
    isPrivate: true,
  };
  const theme = useTheme();
  const biggerThanSm = useMediaQuery(theme.breakpoints.up("sm"));

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useGetProductTypes();
  const productTypes = data?.product_types.filter(
    (productType) => productType.type === PROJECT_SUB,
  );

  const { mutateAsync: createProject } = useCreateProject();
  const { mutateAsync: createProduct } = useCreateUnitProduct();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<DmError | AsError>();

  const { setCurrentProjectId } = useCurrentProjectId();

  const create = async (
    { projectName, flavour, isPrivate }: Values,
    productId?: ProductDetail["id"],
  ) => {
    try {
      if (!productId) {
        const { id } = await createProduct({
          unitId: typeof unitId === "function" ? await unitId() : unitId,
          data: {
            name: projectName,
            type: PROJECT_SUB,
            flavour: flavour as UnitProductPostBodyBodyFlavour,
          },
        });
        productId = id;
      }

      const { project_id } = await createProject({
        data: {
          name: projectName,
          tier_product_id: productId,
          private: isPrivate,
        },
      });
      enqueueSnackbar("Project created");

      queryClient.invalidateQueries(getGetProjectsQueryKey());
      queryClient.invalidateQueries(getGetProductsQueryKey());
      typeof unitId === "string" &&
        queryClient.invalidateQueries(getGetProductsForUnitQueryKey(unitId));

      setCurrentProjectId(project_id);
    } catch (error) {
      enqueueError(error);
    }
  };

  const handleSubmit: ProjectFormikProps["onSubmit"] = async (values, { setSubmitting }) => {
    try {
      await create(values, product?.id);
      modal?.onClose();
    } catch (error) {
      enqueueError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const children: ProjectFormikProps["children"] = ({ submitForm, isSubmitting, isValid }) => (
    <Form style={{ marginTop: theme.spacing() }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: biggerThanSm ? "1fr 1fr auto auto" : "1fr",
          gap: 1,
        }}
      >
        <Field autoFocus fullWidth component={TextField} label="Project Name" name="projectName" />

        {isError ? (
          <Typography color="error">{getErrorMessage(error)}</Typography>
        ) : (
          <Field
            fullWidth
            select
            component={TextField}
            disabled={!!product?.id}
            label="Tier"
            name="flavour"
          >
            {isLoading ? (
              <MenuItem disabled>Loading</MenuItem>
            ) : (
              productTypes?.map((product) => {
                return (
                  <MenuItem key={product.flavour} value={product.flavour}>
                    {formatTierString(product.flavour ?? "Unknown Flavour")}
                  </MenuItem>
                );
              })
            )}
          </Field>
        )}

        <FormControlLabel
          control={<Field color="primary" component={Checkbox} name="isPrivate" type="checkbox" />}
          label="Private"
          labelPlacement="start"
        />

        {!modal && (
          <Button disabled={isSubmitting || !isValid} onClick={submitForm}>
            Create
          </Button>
        )}
      </Box>
    </Form>
  );

  const commonProps: ProjectFormikProps = {
    validateOnMount: true,
    initialValues,
    validationSchema: yup.object().shape({
      projectName: yup
        .string()
        .required("A project name is required")
        .matches(/^[A-Za-z0-9-_.][A-Za-z0-9-_. ]*[A-Za-z0-9-_.]$/),
      flavour: yup.string().required("A tier is required"),
    }),
    onSubmit: handleSubmit,
  };

  return modal ? (
    <FormikModalWrapper {...modal} {...commonProps}>
      {children}
    </FormikModalWrapper>
  ) : (
    <Formik {...commonProps}>{children}</Formik>
  );
};
