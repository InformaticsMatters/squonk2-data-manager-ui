import { GetAppRounded } from '@mui/icons-material';
import { IconButton, Tooltip } from '@mui/material';

export interface DownloadButtonProps {
  href: string;
  disabled?: boolean;
  tooltip?: string;
}

export const DownloadButton = ({ href, disabled, tooltip }: DownloadButtonProps) => {
  const button = (
    <IconButton download disabled={disabled} href={href} size="large">
      <GetAppRounded />
    </IconButton>
  );

  return tooltip !== undefined ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};
