import { Box, Typography } from "@mui/material";

import { useCurrentProject } from "../../hooks/projectHooks";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";

/**
 * Displays current context user is working in.
 */
export const OUPContext = () => {
  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();
  const currentProject = useCurrentProject();

  if (unit || organisation || currentProject) {
    return (
      <Box
        flexBasis="200px"
        sx={{
          minWidth: 0,
          outline: (theme) => `2px solid ${theme.palette.primary.light}`,
          borderRadius: 2,
          p: 0.75,
          mr: 1,
        }}
      >
        <Typography noWrap>Org: {organisation?.name}</Typography>
        <Typography noWrap>Unit: {unit?.name}</Typography>
        <Typography noWrap>Project: {currentProject?.name}</Typography>
      </Box>
    );
  }
  return null;
};
