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
import remarkGfm from "remark-gfm";

export interface MarkdownViewerProps {
  /** The Markdown source, as read from the project file. */
  content: string;
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
  a: ({ node: _, ...props }) => <Link {...props} />,
  hr: () => <Divider sx={{ my: 2 }} />,
  blockquote: ({ node: _, ...props }) => (
    <Box
      {...props}
      component="blockquote"
      sx={{ borderColor: "divider", borderLeft: 4, color: "text.secondary", mx: 0, pl: 2 }}
    />
  ),
  img: ({ node: _, ...props }) => <Box {...props} component="img" sx={{ maxWidth: "100%" }} />,
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
 * A project file shown as formatted Markdown, with GitHub's extensions (tables, task lists,
 * strikethrough, autolinks). The file is user content read at runtime, so it is never trusted:
 * react-markdown escapes raw HTML and drops `javascript:` URLs, and neither default may be relaxed
 * (no `rehype-raw`, no permissive `urlTransform`).
 */
export const MarkdownViewer = ({ content, truncated }: MarkdownViewerProps) => (
  <Paper sx={{ my: 2, px: 3, py: 2 }}>
    {!!truncated && (
      <Alert severity="info" sx={{ mb: 2 }}>
        This file is too large to show in full, so only its start is formatted here.
      </Alert>
    )}
    <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  </Paper>
);
