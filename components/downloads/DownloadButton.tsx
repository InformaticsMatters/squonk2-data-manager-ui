import { GetAppRounded } from "@mui/icons-material";
import type { IconButtonProps, TooltipProps } from "@mui/material";
import { IconButton, Tooltip } from "@mui/material";

type AnchorIconButton = IconButtonProps<"a", any>;

export interface DownloadButtonProps
  extends Omit<AnchorIconButton, "title">,
    Partial<Pick<TooltipProps, "title">> {
  /**
   * Link to file to be downloaded. This must be directly downloadable and not started with
   * javascript on the target page. *The base path needs to be applied*.
   */
  href: string;
}

export const DownloadButton = ({
  href,
  disabled,
  title: tooltip,
  ...props
}: DownloadButtonProps) => {
  const button = (
    <IconButton {...props} download disabled={disabled} href={href}>
      <GetAppRounded />
    </IconButton>
  );

  return tooltip !== undefined ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};
