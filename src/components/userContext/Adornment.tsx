import { type ReactNode } from "react";

import { IconButton, Tooltip } from "@mui/material";

import { withBasePath } from "../../utils/app/basePath";

export interface AdornmentProps {
  title: string;
  href: string;
  children: ReactNode;
}

export const Adornment = ({ title, href, children }: AdornmentProps) => (
  <Tooltip title={title}>
    <span>
      <IconButton href={withBasePath(href)} size="small" sx={{ p: "1px" }} target="_blank">
        {children}
      </IconButton>
    </span>
  </Tooltip>
);
