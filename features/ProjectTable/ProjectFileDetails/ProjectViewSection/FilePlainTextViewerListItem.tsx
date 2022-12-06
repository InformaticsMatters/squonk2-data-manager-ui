import { Description } from "@mui/icons-material";
import { ListItemButton, ListItemText } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/router";

export interface FilePlainTextViewerListItemProps {
  fileName: string;
}

export const FilePlainTextViewerListItem = ({ fileName }: FilePlainTextViewerListItemProps) => {
  const {
    query: { project, path },
  } = useRouter();

  return (
    <NextLink
      legacyBehavior
      passHref
      href={{
        pathname: "/project/file",
        query: {
          project,
          file: fileName,
          path,
        },
      }}
    >
      <ListItemButton component="a" rel="noopener noreferrer" target="_blank">
        <ListItemText primary="Plaintext Viewer" secondary="Displays the file as plaintext" />
        <Description color="action" />
      </ListItemButton>
    </NextLink>
  );
};
