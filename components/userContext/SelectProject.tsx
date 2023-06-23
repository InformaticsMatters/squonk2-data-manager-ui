import type { AutocompleteProps } from "@mui/material";
import { Autocomplete, TextField } from "@mui/material";

import type { ProjectSubscription } from "../../features/ProjectStats/useProjectSubscriptions";
import { useProjectSubscriptions } from "../../features/ProjectStats/useProjectSubscriptions";
import { useCurrentProjectId } from "../../hooks/projectHooks";

export type SelectProjectProps = Omit<
  AutocompleteProps<ProjectSubscription, false, false, false>,
  "renderInput" | "options"
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
