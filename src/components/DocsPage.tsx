import { type ComponentType } from "react";

import { NavigateBeforeRounded, NavigateNextRounded } from "@mui/icons-material";
import { Box, Breadcrumbs, Button, Container, Divider, Stack, Typography } from "@mui/material";
import Head from "next/head";
import Link from "next/link";

import {
  docsEntryOf,
  type DocsHref,
  type DocsManifestNode,
  docsSiblings,
} from "../content/docs/manifest";
import { DocsNav } from "./DocsNav";

/** Where this page sits, as the trail of ancestors that leads to it. */
const DocsBreadcrumb = ({
  ancestors,
  node,
}: {
  ancestors: readonly DocsManifestNode[];
  node: DocsManifestNode;
}) =>
  // The tree's root is titled by its own heading, so a one-item trail saying the same word is not
  // drawn beneath it.
  ancestors.length === 0 ? null : (
    <Breadcrumbs sx={{ mb: 2 }}>
      {ancestors.map((ancestor) => (
        <Typography
          color="text.secondary"
          component={Link}
          href={ancestor.href}
          key={ancestor.href}
          variant="body2"
        >
          {ancestor.title}
        </Typography>
      ))}
      <Typography color="text.primary" variant="body2">
        {node.title}
      </Typography>
    </Breadcrumbs>
  );

/** The pages either side of this one, so the documentation can be read straight through. */
const DocsSequence = ({ href }: { href: DocsHref }) => {
  const { next, previous } = docsSiblings(href);

  return next === undefined && previous === undefined ? null : (
    <>
      <Divider sx={{ my: 4 }} />
      <Stack
        direction={{ sm: "row", xs: "column" }}
        spacing={2}
        sx={{ justifyContent: "space-between" }}
      >
        {previous ? (
          <Button component={Link} href={previous.href} startIcon={<NavigateBeforeRounded />}>
            {previous.title}
          </Button>
        ) : (
          <Box />
        )}
        {next ? (
          <Button component={Link} endIcon={<NavigateNextRounded />} href={next.href}>
            {next.title}
          </Button>
        ) : (
          <Box />
        )}
      </Stack>
    </>
  );
};

/**
 * Composes one documentation page: its title, the sidebar, where it sits in the tree, and the pages
 * either side of it.
 *
 * The `href` is keyed against the manifest, so **a documentation page whose URL the tree does not
 * own does not compile**. That is the guard the tree lacked: a page could previously be added, or
 * left behind by a rename, and go on being served while nothing linked to it.
 *
 * Content files supply content alone. Everything a page needs around that content is here, once,
 * rather than pasted into fifteen `.mdx` files that could each drift from the others.
 */
export const withDocsPage = (href: DocsHref, Content: ComponentType) => {
  const { ancestors, node } = docsEntryOf(href);
  const title =
    ancestors.length === 0
      ? "Squonk Data Manager documentation"
      : `${node.title} - Squonk Data Manager documentation`;

  const DocsPage = () => (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: "flex", flexDirection: { md: "row", xs: "column" }, gap: 4 }}>
          <DocsNav current={href} />
          {/* The prose column may shrink to nothing, so a wide code block or table cannot push the
              sidebar off the layout. */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <DocsBreadcrumb ancestors={ancestors} node={node} />
            <Content />
            <DocsSequence href={href} />
          </Box>
        </Box>
      </Container>
    </>
  );

  DocsPage.displayName = `DocsPage(${href})`;
  return DocsPage;
};
