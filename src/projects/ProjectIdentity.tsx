import { Typography } from "@mui/material";

interface ProjectIdentityProps {
  organisationLabel?: string;
  unitLabel?: string;
}

export const ProjectIdentity = ({ organisationLabel, unitLabel }: ProjectIdentityProps) => (
  <Typography color="text.secondary" component="span" sx={{ display: "block", fontSize: 12 }}>
    {[unitLabel, organisationLabel].filter(Boolean).join(" · ")}
  </Typography>
);
