import { Typography } from "@mui/material";

interface ProjectIdentityProps {
  createdLabel?: string;
  flavourLabel?: string;
  organisationLabel?: string;
  unitLabel?: string;
}

export const ProjectIdentity = ({
  createdLabel,
  flavourLabel,
  organisationLabel,
  unitLabel,
}: ProjectIdentityProps) => (
  <Typography color="text.secondary" component="span" sx={{ display: "block", fontSize: 12 }}>
    {[unitLabel, organisationLabel, flavourLabel, createdLabel].filter(Boolean).join(" · ")}
  </Typography>
);
