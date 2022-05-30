import { Box, Typography } from "@mui/material";

import { useOrganisationUnit } from "../../context/organisationUnitContext";
import { useCurrentProject } from "../../hooks/projectHooks";

/**
 * Displays current context user is working in.
 */
export const OUPContext = () => {
  const { organisationUnit } = useOrganisationUnit();
  const currentProject = useCurrentProject();

  const { organisation, unit } = organisationUnit;

  return (
    <Box flexBasis="200px" sx={{ minWidth: 0 }}>
      <Typography noWrap>Org: {organisation?.name}</Typography>
      <Typography noWrap>Unit: {unit?.name}</Typography>
      <Typography noWrap>Project: {currentProject?.name}</Typography>
    </Box>
  );
};
