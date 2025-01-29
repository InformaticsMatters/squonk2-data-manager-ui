import LockIcon from "@mui/icons-material/Lock";
import { Tooltip, Typography, type TypographyProps } from "@mui/material";

export interface ProjectNameProps extends TypographyProps {
  name: string;
  isPrivate: boolean;
}

export const ProjectName = ({ name, isPrivate, ...typographyProps }: ProjectNameProps) => {
  return (
    <Typography
      alignContent="center"
      display="flex"
      gap="0.3em"
      lineHeight="1.5rem"
      {...typographyProps}
    >
      {!!isPrivate && (
        <Tooltip title="Private">
          <LockIcon fontSize="small" />
        </Tooltip>
      )}

      {name}
    </Typography>
  );
};
