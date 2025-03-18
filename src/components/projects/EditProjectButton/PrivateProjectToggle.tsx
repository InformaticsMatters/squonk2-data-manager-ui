import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  usePatchProject,
} from "@squonk/data-manager-client/project";

import { FormControlLabel, Switch } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";

import { type ProjectId } from "../../../hooks/projectHooks";
import { useEnqueueError } from "../../../hooks/useEnqueueStackError";

export interface PrivateProjectToggleProps {
  projectId: ProjectId;
  isPrivate: boolean;
}

export const PrivateProjectToggle = ({ projectId, isPrivate }: PrivateProjectToggleProps) => {
  const { mutateAsync: adjustProject, isPending } = usePatchProject();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();
  const queryClient = useQueryClient();

  const projectPrivacyChangeHandler = async (checked: boolean) => {
    if (projectId) {
      try {
        await adjustProject({ projectId, data: { private: checked } });
        void queryClient.invalidateQueries({ queryKey: getGetProjectsQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });

        if (checked) {
          enqueueSnackbar("The project has been made private", { variant: "success" });
        } else {
          enqueueSnackbar("The project has been made public", { variant: "success" });
        }
      } catch (error) {
        enqueueError(error);
      }
    }
  };

  return (
    <FormControlLabel
      control={
        <Switch
          checked={isPrivate}
          // Disable the switch until all relevant requests have resolved
          disabled={
            isPending ||
            (!!projectId &&
              queryClient.getQueryState(getGetProjectQueryKey(projectId))?.fetchStatus ===
                "fetching")
          }
          onChange={(_event, checked) => void projectPrivacyChangeHandler(checked)}
        />
      }
      label="Private"
    />
  );
};
