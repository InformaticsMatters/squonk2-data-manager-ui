import { Link, Popover } from "@mui/material";
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";

import { FileViewersList } from "./FileViewersList";

export interface ViewFilePopoverProps {
  /**
   * Name of file with extension
   */
  fileName: string;
  /**
   * Absolute path of the directory holding the file, inside the project that owns it.
   */
  path: string;
  /**
   * ID of the project that owns the file. Always given by the caller, so a viewer can never open a
   * file of a project other than the one displaying it.
   */
  projectId: string;
}

export const ViewFilePopover = ({ fileName, path, projectId }: ViewFilePopoverProps) => {
  const popupState = usePopupState({ popupId: `file-viewers-${fileName}`, variant: "popover" });

  return (
    <>
      <Link {...bindTrigger(popupState)} component="button" variant="body1">
        {fileName}
      </Link>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{ horizontal: "center", vertical: "bottom" }}
        transformOrigin={{ horizontal: "center", vertical: "top" }}
      >
        <FileViewersList
          fileName={fileName}
          path={path}
          projectId={projectId}
          onClick={() => popupState.close()}
        />
      </Popover>
    </>
  );
};
