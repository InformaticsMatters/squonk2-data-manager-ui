import { useQueryClient } from "react-query";

import {
  getGetProjectQueryKey,
  getGetProjectsQueryKey,
  usePatchProject,
} from "@squonk/data-manager-client/project";

import { FormControlLabel, Switch } from "@mui/material";

import type { ProjectId } from "../../../../hooks/projectHooks";
import { useEnqueueError } from "../../../../hooks/useEnqueueStackError";
import { getErrorMessage } from "../../../../utils/next/orvalError";

export interface PrivateProjectToggleProps {
  projectId: ProjectId;
  isPrivate: boolean;
}

export const PrivateProjectToggle = ({ projectId, isPrivate }: PrivateProjectToggleProps) => {
  const { mutateAsync: adjustProject, isLoading } = usePatchProject();
  const { enqueueError, enqueueSnackbar } = useEnqueueError();
  const queryClient = useQueryClient();

  return (
    <FormControlLabel
      control={
        <Switch
          checked={isPrivate}
          // Disable the switch until all relevant requests have resolved
          disabled={
            isLoading ||
            (!!projectId && queryClient.getQueryState(getGetProjectQueryKey(projectId))?.isFetching)
          }
          onChange={async (_event, checked) => {
            if (projectId) {
              try {
                await adjustProject({
                  projectId,
                  data: {
                    private: checked,
                  },
                });
                queryClient.invalidateQueries(getGetProjectsQueryKey());
                queryClient.invalidateQueries(getGetProjectQueryKey(projectId));

                if (checked) {
                  enqueueSnackbar("The project has been made private", { variant: "success" });
                } else {
                  enqueueSnackbar("The project has been made public", { variant: "success" });
                }
              } catch (error) {
                enqueueError(getErrorMessage(error));
              }
            }
          }}
        />
      }
      label="Private"
    />
  );
};
