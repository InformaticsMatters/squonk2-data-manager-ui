import { Typography } from "@mui/material";

interface ProjectIdentityProps {
  organisationId?: string;
  unitId?: string;
}

export const ProjectIdentity = ({ organisationId, unitId }: ProjectIdentityProps) => (
  <Typography color="text.secondary" component="span" sx={{ display: "block", fontSize: 12 }}>
    {[unitId, organisationId].filter(Boolean).join(" · ")}
  </Typography>
);
