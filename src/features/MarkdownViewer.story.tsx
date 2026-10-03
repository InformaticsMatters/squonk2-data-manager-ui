import { AppScaffold } from "../stories/decorators";
import { MarkdownViewer } from "./MarkdownViewer";

const document = `# Results

Some **bold** and ~~struck~~ text, with a [link](https://example.com).

| Ligand | Score |
| ------ | ----: |
| A      | 0.92  |

- [x] Docked
- [ ] Scored

<script>window.injected = true</script>

[unsafe](javascript:alert(1))
`;

/** GitHub-flavoured Markdown, including raw HTML and a script URL that must not run. */
export const Formatted = () => (
  <AppScaffold>
    <MarkdownViewer content={document} truncated={false} />
  </AppScaffold>
);

/** Only the start of a larger file was delivered. */
export const Truncated = () => (
  <AppScaffold>
    <MarkdownViewer truncated content="# Start of a long file" />
  </AppScaffold>
);
