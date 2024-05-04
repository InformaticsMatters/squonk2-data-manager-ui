import { Autocomplete, type AutocompleteProps, TextField } from "@mui/material";

import {
  type ProjectSubscription,
  useProjectSubscriptions,
} from "../../features/ProjectStats/useProjectSubscriptions";
import { useCurrentProjectId } from "../../hooks/projectHooks";

export type SelectProjectProps = Omit<
  AutocompleteProps<ProjectSubscription, false, false, false>,
  "options" | "renderInput"
>;

export const SelectProject = (props: SelectProjectProps) => {
  const { projectSubscriptions, isLoading } = useProjectSubscriptions(["none"]);

  const { projectId, setCurrentProjectId } = useCurrentProjectId();

  return (
    <Autocomplete
      {...props}
      fullWidth
      getOptionLabel={(option) => option.name}
      loading={isLoading}
      options={projectSubscriptions}
      renderInput={(params) => <TextField {...params} label="Project" />}
      value={projectSubscriptions.find((sub) => sub.project_id === projectId) ?? null}
      onChange={(_, value) => setCurrentProjectId(value?.claim?.id ?? undefined)}
    />
  );
};
