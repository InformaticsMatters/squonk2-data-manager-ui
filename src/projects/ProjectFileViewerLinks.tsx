import { type ReactNode } from "react";

import { Biotech as BiotechIcon, Description as DescriptionIcon } from "@mui/icons-material";
import { Link, List, ListItemButton, ListItemIcon, ListItemText, Popover } from "@mui/material";
import { bindPopover, bindTrigger } from "material-ui-popup-state";
import { usePopupState } from "material-ui-popup-state/hooks";
import A from "next/link";

import { childFilesystemPath } from "./fileFacts";
import { type FileViewer, fileViewerLabels, fileViewersFor } from "./fileViewers";
import { projectLinks } from "./routes";

/** The icon each viewer is recognised by; what it is called is a viewer fact Files owns. */
const fileViewerIcons: Record<FileViewer, ReactNode> = {
  browser: <DescriptionIcon color="action" />,
  sdf: <BiotechIcon color="action" />,
  text: <DescriptionIcon color="action" />,
};

export interface ProjectFileViewerLinksProps {
  /** Absolute path of the directory holding the file, inside the project that owns it. */
  directory: string;
  fileName: string;
  /**
   * ID of the project that owns the file. Always given by the caller, so a viewer can never open a
   * file of a project other than the one displaying it.
   */
  projectId: string;
}

/**
 * The viewers one file offers, each addressing that file beneath the project that holds it. Every
 * link is the file's own canonical Files route carrying the viewer it names and nothing else, so
 * opening one keeps the project workspace, and leaving it returns to the directory it was opened
 * from.
 */
export const ProjectFileViewerLinks = ({
  directory,
  fileName,
  projectId,
}: ProjectFileViewerLinksProps) => {
  const popupState = usePopupState({ popupId: `file-viewers-${fileName}`, variant: "popover" });
  const path = childFilesystemPath(directory, fileName);

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
        <List sx={{ maxWidth: "600px" }}>
          {fileViewersFor(fileName).map((viewer) => {
            const { name, summary } = fileViewerLabels[viewer];
            return (
              <ListItemButton
                component={A}
                href={projectLinks.fileView(projectId, { path, viewer }) as never}
                key={viewer}
                onClick={() => popupState.close()}
              >
                <ListItemText primary={name} secondary={summary} />
                <ListItemIcon sx={{ ml: 2 }}>{fileViewerIcons[viewer]}</ListItemIcon>
              </ListItemButton>
            );
          })}
        </List>
      </Popover>
    </>
  );
};
