import {
  type AsError,
  type ProductDetail,
  ProductDetailFlavour,
  ProductDetailType,
  type UnitAllDetail,
  UnitAllDetailDefaultProductPrivacy,
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
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useCurrentProjectId } from "../../../hooks/projectHooks";
import { useEnqueueError } from "../../../hooks/useEnqueueStackError";
import { formatTierString } from "../../../utils/app/products";
import { getErrorMessage } from "../../../utils/next/orvalError";
import { FormModalWrapper, type FormModalWrapperProps } from "../../modals/FormModalWrapper";
import { PrivacyToggle } from "./PrivacyToggle";

const PROJECT_SUB = ProductDetailType.DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION;

export interface CreateProjectFormProps {
  modal?: Pick<FormModalWrapperProps, "id" | "onClose" | "open" | "submitText" | "title">;
  unitId: UnitAllDetail["id"] | (() => Promise<UnitAllDetail["id"]>);
  defaultPrivacy: UnitAllDetailDefaultProductPrivacy;
  product?: ProductDetail;
  autoFocus?: boolean;
}

export interface Values {
  projectName: string;
  flavour: string;
  isPrivate: boolean;
}

const isPrivateDefaultValues: Record<UnitAllDetailDefaultProductPrivacy, boolean> = {
  ALWAYS_PRIVATE: true,
  ALWAYS_PUBLIC: false,
  DEFAULT_PUBLIC: false,
  DEFAULT_PRIVATE: true,
};

// Create Zod schema for validation
const formSchema = z.object({
  projectName: z
    .string()
    .min(1, "A project name is required")
    .regex(/^[A-Za-z0-9-_.][A-Za-z0-9-_. ]*[A-Za-z0-9-_.]$/u, "Invalid project name format"),
  flavour: z.string().min(1, "A tier is required"),
  isPrivate: z.boolean(),
});

export const CreateProjectForm = ({
  modal,
  unitId,
  defaultPrivacy,
  product,
  autoFocus = true,
}: CreateProjectFormProps) => {
  const evaluationAllowed = defaultPrivacy !== UnitAllDetailDefaultProductPrivacy.ALWAYS_PRIVATE;
  const defaultFlavour = (
    defaultPrivacy === UnitAllDetailDefaultProductPrivacy.ALWAYS_PRIVATE ||
    defaultPrivacy === UnitAllDetailDefaultProductPrivacy.DEFAULT_PRIVATE
      ? ProductDetailFlavour.BRONZE
      : ProductDetailFlavour.EVALUATION
  ) satisfies ProductDetailFlavour;

  const initialValues: Values = {
    projectName: "",
    flavour: product?.flavour ?? defaultFlavour,
    isPrivate: isPrivateDefaultValues[defaultPrivacy],
  };

  const theme = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useGetProductTypes();
  const productTypes = data?.product_types.filter(
    (productType) => productType.type === PROJECT_SUB,
  );

  const { mutateAsync: createProject } = useCreateProject();
  const { mutateAsync: createProduct } = useCreateUnitProduct();

  const { enqueueError, enqueueSnackbar } = useEnqueueError<AsError | DmError>();

  const { setCurrentProjectId } = useCurrentProjectId();

  const create = async (values: Values, productId?: ProductDetail["id"]) => {
    try {
      if (!productId) {
        const { id } = await createProduct({
          unitId: typeof unitId === "function" ? await unitId() : unitId,
          data: {
            name: values.projectName,
            type: PROJECT_SUB,
            flavour: values.flavour as UnitProductPostBodyBodyFlavour,
          },
        });
        productId = id;
      }

      const { project_id } = await createProject({
        data: {
          name: values.projectName,
          tier_product_id: productId,
          private: values.isPrivate,
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

  const form = useForm({
    defaultValues: initialValues as z.infer<typeof formSchema>,
    onSubmit: async ({ value }) => {
      try {
        await create(value, product?.id);
        modal?.onClose();
      } catch (error) {
        enqueueError(error);
      }
    },
    validators: {
      onChange: formSchema,
    },
  });

  const formContent = () => (
    <div style={{ marginTop: theme.spacing() }}>
      <FormControl
        component="fieldset"
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" + (modal ? "" : " auto") },
          gap: 1,
          alignItems: "baseline",
        }}
      >
        <FormLabel component="legend" sx={{ mb: 1 }}>
          Unit default privacy: {defaultPrivacy.split("_").join(" ").toLocaleLowerCase()}
        </FormLabel>

        <form.Field name="projectName">
          {(field) => (
            <TextField
              fullWidth
              autoFocus={autoFocus}
              error={field.state.meta.errors.length > 0}
              helperText={field.state.meta.errors.map((error) => error?.message)[0]}
              label="Project Name"
              name="projectName"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          )}
        </form.Field>

        {isError ? (
          <Typography color="error">{getErrorMessage(error)}</Typography>
        ) : (
          <form.Field name="flavour">
            {(field) => (
              <TextField
                fullWidth
                select
                disabled={!!product?.id}
                error={field.state.meta.errors.length > 0}
                helperText={field.state.meta.errors.map((error) => error?.message)[0]}
                label="Tier"
                name="flavour"
                value={field.state.value}
                onChange={(e) => {
                  field.handleChange(e.target.value);
                  // Set isPrivate to false for evaluation tier
                  if (e.target.value === ProductDetailFlavour.EVALUATION) {
                    form.setFieldValue("isPrivate", false);
                  } else {
                    // Otherwise set to default value
                    form.setFieldValue("isPrivate", isPrivateDefaultValues[defaultPrivacy]);
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
              </TextField>
            )}
          </form.Field>
        )}

        <Tooltip title="Toggle whether this project can be viewed by other platform users">
          {/* Span to prevent forward ref warning, probably fixed in react 19 */}
          <span>
            <form.Field name="isPrivate">
              {(field) => (
                <PrivacyToggle
                  defaultPrivacy={defaultPrivacy}
                  field={{
                    state: {
                      value: field.state.value,
                    },
                    handleChange: field.handleChange,
                  }}
                  flavour={form.state.values.flavour}
                />
              )}
            </form.Field>
          </span>
        </Tooltip>

        {!modal && (
          <Button
            disabled={!form.state.canSubmit || form.state.isSubmitting}
            onClick={() => void form.handleSubmit()}
          >
            Create
          </Button>
        )}
      </FormControl>
    </div>
  );

  return modal ? (
    <FormModalWrapper {...modal} closeText="Cancel" form={form}>
      {formContent()}
    </FormModalWrapper>
  ) : (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      {formContent()}
    </form>
  );
};
