import { type HTMLProps } from "react";

import { Button, type ButtonProps } from "@mui/material";

// Button Props doesn't support target and rel when using as a Link
type MissingButtonProps = Pick<HTMLProps<HTMLAnchorElement>, "rel" | "target">;

// ? odd that typescript doesn't raise an issue here as `MissingButtonProps` contains invalid props
export const HrefButton = (props: ButtonProps & MissingButtonProps) => <Button {...props} />;
