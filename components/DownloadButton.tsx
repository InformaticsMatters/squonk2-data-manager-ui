import { IconButton, Tooltip } from '@material-ui/core';
import { GetAppRounded } from '@material-ui/icons';

export interface DownloadButtonProps {
  href: string;
  disabled?: boolean;
  tooltip?: string;
}

export const DownloadButton = ({ href, disabled, tooltip }: DownloadButtonProps) => {
  const button = (
    <IconButton download disabled={disabled} href={href}>
      <GetAppRounded />
    </IconButton>
  );

  return tooltip !== undefined ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};
