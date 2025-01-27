import { Box, Typography } from "@mui/material";

import { useCurrentProject } from "../../hooks/projectHooks";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";

export interface OUPContextProps {
  sx?: any;
}

/**
 * Displays current context user is working in.
 */
export const OUPContext = ({ sx }: OUPContextProps) => {
  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();
  const currentProject = useCurrentProject();

  if (!!unit || !!organisation || !!currentProject) {
    return (
      <Box
        sx={[
          {
            flexBasis: "200px",
            flexDirection: "column",
            minWidth: 0,
            outline: "2px solid",
            outlineColor: "primary.light",
            borderRadius: 2,
            p: 0.75,
            mr: 1,
          },
          sx,
        ]}
      >
        <Typography noWrap>
          <em>Org</em>: {organisation?.name}
        </Typography>
        <Typography noWrap>
          <em>Unit</em>: {unit?.name}
        </Typography>
        <Typography noWrap>
          <em>Project</em>: {currentProject?.name}
        </Typography>
      </Box>
    );
  }
  return null;
};
