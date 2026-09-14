import { Box, List, ListItemButton, ListItemText, Paper, Typography } from "@mui/material";
import Link from "next/link";

import { docsManifest, type DocsManifestNode, type DocsRoute } from "../content/docs/manifest";

/**
 * One branch of the tree, drawn at the depth it sits at. A guide with sections beneath it lists
 * them under itself rather than beside it, so the sidebar has the same shape as the application's
 * own workspaces and sections.
 */
const NavBranch = ({
  current,
  depth,
  node,
}: {
  current: DocsRoute;
  depth: number;
  node: DocsManifestNode;
}) => (
  <>
    <ListItemButton
      component={Link}
      href={node.href}
      selected={current === node.href}
      sx={{ borderRadius: 1, pl: 1 + depth * 2, py: 0.25 }}
    >
      <ListItemText
        slotProps={{
          primary: { sx: { fontWeight: current === node.href ? 700 : 400 }, variant: "body2" },
        }}
      >
        {node.title}
      </ListItemText>
    </ListItemButton>
    {node.children.map((child) => (
      <NavBranch current={current} depth={depth + 1} key={child.href} node={child} />
    ))}
  </>
);

/**
 * The documentation sidebar, drawn from the manifest.
 *
 * It replaces a three-link map written into this file by hand, which left the deployed-jobs and
 * developer pages reachable from the home page and from nowhere inside the documentation at all.
 * Every page the tree owns is listed here, because the tree is the one thing that decides what the
 * documentation contains.
 */
export const DocsNav = ({ current }: { current: DocsRoute }) => (
  <Box
    aria-label="Documentation"
    component="nav"
    sx={{
      alignSelf: "flex-start",
      flex: { md: "0 0 240px" },
      position: { md: "sticky" },
      top: 16,
      width: "100%",
    }}
  >
    <Paper sx={{ p: 1 }} variant="outlined">
      <Typography color="text.secondary" sx={{ px: 1 }} variant="overline">
        Documentation
      </Typography>
      <List dense disablePadding>
        {docsManifest.children.map((node) => (
          <NavBranch current={current} depth={0} key={node.href} node={node} />
        ))}
      </List>
    </Paper>
  </Box>
);
