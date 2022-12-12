import type { HTMLProps } from "react";

import type { ButtonProps } from "@mui/material";
import { Button } from "@mui/material";

// Button Props doesn't support target and rel when using as a Link
type MissingButtonProps = Pick<HTMLProps<HTMLAnchorElement>, "target" | "rel">;

// ? odd that typescript doesn't raise an issue here as `MissingButtonProps` contains invalid props
export const HrefButton = (props: ButtonProps & MissingButtonProps) => <Button {...props} />;
