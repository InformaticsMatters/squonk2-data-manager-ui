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

See [the method](method.md), [the poses](data/poses.sdf), [all results](../results/) and
[outside the project](../../../secret.md).

![plot](img/plot.png)
`;

const projectId = "project-33333333-3333-3333-3333-333333333333";

/** GitHub-flavoured Markdown, including raw HTML and a script URL that must not run. */
export const Formatted = () => (
  <AppScaffold>
    <MarkdownViewer content={document} directory="/notes" projectId={projectId} truncated={false} />
  </AppScaffold>
);

/** Only the start of a larger file was delivered. */
export const Truncated = () => (
  <AppScaffold>
    <MarkdownViewer
      truncated
      content="# Start of a long file"
      directory="/"
      projectId={projectId}
    />
  </AppScaffold>
);
