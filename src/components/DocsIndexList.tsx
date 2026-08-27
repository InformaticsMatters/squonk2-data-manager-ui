import { List, ListItemButton, ListItemText } from "@mui/material";
import Link from "next/link";

import { type DocsHref, docsNode } from "../content/docs/manifest";

/**
 * The pages beneath one node of the documentation tree, each with the line that says what it is
 * for.
 *
 * Every index that lists guides renders this — `/docs`, `/docs/how-to` and the home page — so the
 * three hand-maintained lists that used to disagree with each other, and with the sidebar, are one
 * list read from the manifest.
 */
export const DocsIndexList = ({ href }: { href: DocsHref }) => (
  <List>
    {docsNode(href).children.map((child) => (
      <ListItemButton component={Link} href={child.href} key={child.href} sx={{ borderRadius: 1 }}>
        <ListItemText primary={child.title} secondary={child.blurb} />
      </ListItemButton>
    ))}
  </List>
);
