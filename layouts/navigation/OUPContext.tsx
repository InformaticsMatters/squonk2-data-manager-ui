import { Box, Typography } from "@mui/material";

import { useCurrentProject } from "../../hooks/projectHooks";
import { useSelectedOrganisation } from "../../state/organisationSelection";
import { useSelectedUnit } from "../../state/unitSelection";

export interface OUPContextProps {
  header?: boolean;
}

/**
 * Displays current context user is working in.
 */
export const OUPContext = ({ header = false }: OUPContextProps) => {
  const [unit] = useSelectedUnit();
  const [organisation] = useSelectedOrganisation();
  const currentProject = useCurrentProject();

  if (unit || organisation || currentProject) {
    return (
      <>
        {header && (
          <Typography gutterBottom variant="h3">
            Project
          </Typography>
        )}
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
      </>
    );
  }
  return null;
};
