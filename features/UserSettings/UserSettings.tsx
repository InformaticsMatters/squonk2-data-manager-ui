import { Link } from "@mui/material";

export interface UserSettingsProps {
  open: boolean;
  closeSettings: () => void;
  openSettings: () => void;
}

/**
 * A button styled as a link which displays User Settings on click.
 */
export const UserSettings = ({ openSettings }: UserSettingsProps) => {
  return (
    <Link component="button" variant="body1" onClick={openSettings}>
      Settings
    </Link>
  );
};
