import {
  type AsError,
  type ProductDetail,
  ProductDetailFlavour,
  ProductDetailType,
  type UnitDetail,
  UnitDetailDefaultProductPrivacy,
  type UnitProductPostBodyBodyFlavour,
} from "@squonk/account-server-client";
import {
  getGetProductsForUnitQueryKey,
  getGetProductsQueryKey,
  useCreateUnitProduct,
  useGetProductTypes,
} from "@squonk/account-server-client/product";
import { type DmError } from "@squonk/data-manager-client";
import { getGetUserInventoryQueryKey } from "@squonk/data-manager-client/inventory";
import { getGetProjectsQueryKey, useCreateProject } from "@squonk/data-manager-client/project";

import {
  Button,
  FormControl,
  FormLabel,
  MenuItem,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Field, Form, Formik, type FormikConfig } from "formik";
import { TextField } from "formik-mui";
import * as yup from "yup";

import { useCurrentProjectId } from "../../../hooks/projectHooks";
import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { type Resolve } from "../../../types";
import { formatTierString } from "../../../utils/app/products";
import { getErrorMessage } from "../../../utils/next/orvalError";
import { FormikModalWrapper, type FormikModalWrapperProps } from "../../modals/FormikModalWrapper";
import { PrivacyToggle } from "./PrivacyToggle";

const PROJECT_SUB = ProductDetailType.DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION;

export interface CreateProjectFormProps {
  modal?: Resolve<
    Pick<FormikModalWrapperProps, "id" | "onClose" | "open" | "submitText" | "title">
  >;
  unitId: UnitDetail["id"] | (() => Promise<UnitDetail["id"]>);
  defaultPrivacy: UnitDetailDefaultProductPrivacy;
  product?: ProductDetail;
  autoFocus?: boolean;
}

export interface Values {
  projectName: string;
  flavour: string;
  isPrivate: boolean;
}

type ProjectFormikProps = FormikConfig<Values>;

const isPrivateDefaultValues: Record<UnitDetailDefaultProductPrivacy, boolean> = {
  ALWAYS_PRIVATE: true,
  ALWAYS_PUBLIC: false,
  DEFAULT_PUBLIC: false,
  DEFAULT_PRIVATE: true,
};

export const CreateProjectForm = ({
  modal,
  unitId,
  defaultPrivacy,
  product,
  autoFocus = true,
}: CreateProjectFormProps) => {
  const evaluationAllowed = defaultPrivacy !== UnitDetailDefaultProductPrivacy.ALWAYS_PRIVATE;
  const defaultFlavour = (
    defaultPrivacy === UnitDetailDefaultProductPrivacy.ALWAYS_PRIVATE ||
    defaultPrivacy === UnitDetailDefaultProductPrivacy.DEFAULT_PRIVATE
      ? ProductDetailFlavour.BRONZE
      : ProductDetailFlavour.EVALUATION
  ) satisfies ProductDetailFlavour;

  const initialValues: Values = {
    projectName: "",
    flavour: product?.flavour ?? defaultFlavour,
    isPrivate: isPrivateDefaultValues[defaultPrivacy],
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

  const { enqueueError, enqueueSnackbar } = useEnqueueError<AsError | DmError>();

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

      void queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getGetProductsQueryKey() });
      if (typeof unitId === "string") {
        void queryClient.invalidateQueries({ queryKey: getGetProductsForUnitQueryKey(unitId) });
        void queryClient.invalidateQueries({
          queryKey: getGetUserInventoryQueryKey({ unit_id: unitId }),
        });
      }

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

  const children: ProjectFormikProps["children"] = ({
    submitForm,
    isSubmitting,
    isValid,
    handleChange,
    setFieldValue,
    values,
    touched,
  }) => (
    <Form style={{ marginTop: theme.spacing() }}>
      <FormControl
        component="fieldset"
        sx={{
          display: "grid",
          gridTemplateColumns: biggerThanSm ? "1fr 1fr auto" + (modal ? "" : " auto") : "1fr",
          gap: 1,
          alignItems: "baseline",
        }}
      >
        <FormLabel component="legend" sx={{ mb: 1 }}>
          Unit default privacy: {defaultPrivacy.split("_").join(" ").toLowerCase()}
        </FormLabel>

        <Field
          fullWidth
          autoFocus={autoFocus}
          component={TextField}
          label="Project Name"
          name="projectName"
        />

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
            onChange={(event: any) => {
              handleChange(event);
              if (event.target.value === ProductDetailFlavour.EVALUATION) {
                void setFieldValue("isPrivate", false);
              } else if (!touched.isPrivate) {
                void setFieldValue("isPrivate", isPrivateDefaultValues[defaultPrivacy]);
              }
            }}
          >
            {isLoading ? (
              <MenuItem disabled>Loading</MenuItem>
            ) : (
              productTypes?.map((product) => {
                return (
                  <MenuItem
                    disabled={
                      product.flavour === ProductDetailFlavour.EVALUATION && !evaluationAllowed
                    }
                    key={product.flavour}
                    value={product.flavour}
                  >
                    {formatTierString(product.flavour ?? "Unknown Flavour")}
                  </MenuItem>
                );
              })
            )}
          </Field>
        )}

        <Tooltip title="Toggle whether this project can be viewed by other platform users">
          {/* Span to prevent forward ref warning, probably fixed in react 19 */}
          <span>
            <PrivacyToggle defaultPrivacy={defaultPrivacy} flavour={values.flavour} />
          </span>
        </Tooltip>

        {!modal && (
          <Button disabled={isSubmitting || !isValid} onClick={() => void submitForm()}>
            Create
          </Button>
        )}
      </FormControl>
    </Form>
  );

  const commonProps: ProjectFormikProps = {
    validateOnMount: true,
    initialValues,
    validationSchema: yup.object().shape({
      projectName: yup
        .string()
        .required("A project name is required")
        .matches(/^[A-Za-z0-9-_.][A-Za-z0-9-_. ]*[A-Za-z0-9-_.]$/u),
      flavour: yup.string().required("A tier is required"),
    }),
    onSubmit: handleSubmit,
  };

  return modal ? (
    <FormikModalWrapper {...modal} {...commonProps} closeText="Cancel">
      {children}
    </FormikModalWrapper>
  ) : (
    <Formik {...commonProps}>{children}</Formik>
  );
};
