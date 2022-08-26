import { Description } from "@mui/icons-material";
import { ListItem, ListItemText } from "@mui/material";
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
      <ListItem button component="a" rel="noopener noreferrer" target="_blank">
        <ListItemText primary="Plaintext Viewer" secondary="Displays the file as plaintext" />
        <Description color="action" />
      </ListItem>
    </NextLink>
  );
};
