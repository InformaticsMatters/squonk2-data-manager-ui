import type { ProductDmProjectTier } from "@squonk/account-server-client";

import type { AutocompleteProps } from "@mui/material";
import { Autocomplete, TextField } from "@mui/material";

import { useCurrentProjectId } from "../../hooks/projectHooks";
import { useProjectSubscriptions } from "../UserSettings/UserSettingsContent/ProjectStatsSection/useProjectSubscriptions";

export type ProjectAutocompleteProps = Omit<
  AutocompleteProps<ProductDmProjectTier, false, false, false>,
  "renderInput" | "options"
>;

export const ProjectAutocomplete = (props: ProjectAutocompleteProps) => {
  const { projectSubscriptions, isLoading: isProjectSubscriptionsLoading } =
    useProjectSubscriptions();

  const { projectId, setCurrentProjectId } = useCurrentProjectId();

  return (
    <Autocomplete
      {...props}
      fullWidth
      getOptionLabel={(option) => option.product.name ?? "Missing name"}
      loading={isProjectSubscriptionsLoading}
      options={projectSubscriptions}
      renderInput={(params) => <TextField {...params} label="Project" />}
      value={projectSubscriptions.find((sub) => sub.claim?.id == projectId) ?? null}
      onChange={(_, value) => setCurrentProjectId(value?.claim?.id ?? undefined)}
    />
  );
};
