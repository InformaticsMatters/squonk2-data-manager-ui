import { Link, Popover } from "@mui/material";
import { bindPopover, bindTrigger } from "material-ui-popup-state/core";
import { usePopupState } from "material-ui-popup-state/hooks";

import { FileViewersList } from "./FileViewersList";

export interface ViewFilePopoverProps {
  /**
   * Name of file with extension
   */
  fileName: string;
  /**
   * Path to file without leading "/"
   */
  path?: string;
}

export const ViewFilePopover = ({ fileName, path }: ViewFilePopoverProps) => {
  const popupState = usePopupState({
    variant: "popover",
    popupId: `file-viewers-${fileName}`,
  });

  return (
    <>
      <Link {...bindTrigger(popupState)} component="button" variant="body1">
        {fileName}
      </Link>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <FileViewersList fileName={fileName} path={path} />
      </Popover>
    </>
  );
};
