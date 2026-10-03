import ReactMarkdown, { type Components } from "react-markdown";

import {
  Alert,
  Box,
  Divider,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import A from "next/link";
import remarkGfm from "remark-gfm";

import { resolveMarkdownHref, resolveMarkdownImageSrc } from "./markdownLinks";

export interface MarkdownViewerProps {
  /** The Markdown source, as read from the project file. */
  content: string;
  /** Absolute path of the directory holding the file, which its relative links resolve against. */
  directory: string;
  /** ID of the project holding the file, which every project link it makes stays inside. */
  projectId: string;
  /** Whether `content` is only the start of the file. */
  truncated: boolean;
}

/**
 * Markdown elements as MUI components. Every override drops `node`, the syntax tree react-markdown
 * passes alongside the element's own props, so it never reaches the DOM. Headings keep their own
 * elements but are shown a few sizes down, so a document's `#` title does not outrank the page.
 */
const components: Components = {
  h1: ({ node: _, ...props }) => (
    <Typography {...props} gutterBottom component="h1" sx={{ mt: 2 }} variant="h4" />
  ),
  h2: ({ node: _, ...props }) => (
    <Typography {...props} gutterBottom component="h2" sx={{ mt: 2 }} variant="h5" />
  ),
  h3: ({ node: _, ...props }) => (
    <Typography {...props} gutterBottom component="h3" sx={{ mt: 2 }} variant="h6" />
  ),
  h4: ({ node: _, ...props }) => (
    <Typography {...props} gutterBottom component="h4" sx={{ mt: 2 }} variant="subtitle1" />
  ),
  h5: ({ node: _, ...props }) => (
    <Typography {...props} gutterBottom component="h5" sx={{ mt: 2 }} variant="subtitle2" />
  ),
  h6: ({ node: _, ...props }) => (
    <Typography {...props} gutterBottom component="h6" sx={{ mt: 2 }} variant="subtitle2" />
  ),
  p: ({ node: _, ...props }) => <Typography {...props} gutterBottom component="p" />,
  li: ({ node: _, ...props }) => <Typography {...props} component="li" />,
  hr: () => <Divider sx={{ my: 2 }} />,
  blockquote: ({ node: _, ...props }) => (
    <Box
      {...props}
      component="blockquote"
      sx={{ borderColor: "divider", borderLeft: 4, color: "text.secondary", mx: 0, pl: 2 }}
    />
  ),
  pre: ({ node: _, ...props }) => (
    <Box
      {...props}
      component="pre"
      sx={{ bgcolor: "action.hover", borderRadius: 1, overflowX: "auto", p: 1.5 }}
    />
  ),
  code: ({ node: _, ...props }) => (
    <Box {...props} component="code" sx={{ fontFamily: "monospace", fontSize: "0.875em" }} />
  ),
  table: ({ node: _, ...props }) => (
    <TableContainer sx={{ mb: 2 }}>
      <Table {...props} size="small" />
    </TableContainer>
  ),
  thead: ({ node: _, ...props }) => <TableHead {...props} />,
  tbody: ({ node: _, ...props }) => <TableBody {...props} />,
  tr: ({ node: _, ...props }) => <TableRow {...props} />,
  th: ({ node: _, align: __, ...props }) => <TableCell {...props} />,
  td: ({ node: _, align: __, ...props }) => <TableCell {...props} />,
};

/**
 * Links and images, resolved against the project and directory holding the file. A link that names
 * nothing the project can open is shown as its text, and an image that cannot load as its alt text.
 */
const linkComponents = (projectId: string, directory: string): Components => ({
  a: ({ node: _, href = "", children, ...props }) => {
    const link = resolveMarkdownHref(projectId, directory, href);
    if (link === null) {
      return <>{children}</>;
    }
    return link.external ? (
      <Link {...props} href={link.href} rel="noopener noreferrer" target="_blank">
        {children}
      </Link>
    ) : (
      <Link {...props} component={A} href={link.href as never}>
        {children}
      </Link>
    );
  },
  img: ({ node: _, src, ...props }) => {
    const source =
      typeof src === "string" ? resolveMarkdownImageSrc(projectId, directory, src) : null;
    return source === null ? (
      <>{props.alt}</>
    ) : (
      <Box {...props} component="img" src={source} sx={{ maxWidth: "100%" }} />
    );
  },
});

/**
 * A project file shown as formatted Markdown, with GitHub's extensions (tables, task lists,
 * strikethrough, autolinks). The file is user content read at runtime, so it is never trusted:
 * react-markdown escapes raw HTML and drops `javascript:` URLs, and neither default may be relaxed
 * (no `rehype-raw`, no permissive `urlTransform`).
 */
export const MarkdownViewer = ({
  content,
  directory,
  projectId,
  truncated,
}: MarkdownViewerProps) => (
  <Paper sx={{ my: 2, px: 3, py: 2 }}>
    {!!truncated && (
      <Alert severity="info" sx={{ mb: 2 }}>
        This file is too large to show in full, so only its start is formatted here.
      </Alert>
    )}
    <ReactMarkdown
      components={{ ...components, ...linkComponents(projectId, directory) }}
      remarkPlugins={[remarkGfm]}
    >
      {content}
    </ReactMarkdown>
  </Paper>
);
