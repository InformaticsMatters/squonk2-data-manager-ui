import { type ReactNode } from "react";

import { IconButton, Tooltip } from "@mui/material";

export interface AdornmentProps {
  title: string;
  href: string;
  children: ReactNode;
}

export const Adornment = ({ title, href, children }: AdornmentProps) => (
  <Tooltip title={title}>
    <span>
      <IconButton
        href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${href}`}
        size="small"
        sx={{ p: "1px" }}
        target="_blank"
      >
        {children}
      </IconButton>
    </span>
  </Tooltip>
);
