import { type Theme } from "@mui/material";

/**
 * A kind of definition the platform runs. It is this application's domain vocabulary rather than a
 * theme's, which is why the kinds are coloured here rather than in `@squonk/mui-theme`: that package
 * is general and shared, and these three are ours.
 */
export type DefinitionKind = "application" | "job" | "workflow";

export interface DefinitionKindIdentity {
  /**
   * A solid fill, identical in both colour schemes. It is used where the kind's colour is a shape —
   * a card's accent bar, a chip's tint — rather than something a reader has to read through.
   */
  accent: string;
  /**
   * The kind's colour where it is text. An accent legible as a fill is not necessarily legible as
   * ink, and neither scheme's ink is legible in the other, so each is named.
   */
  ink: { dark: string; light: string };
  /** What the kind is called wherever a card or a chip says so in words. */
  label: string;
}

/**
 * The one place any definition kind is coloured or named. Run and Results both read it, so a job is
 * the same colour wherever it is drawn, and a fourth kind is added here rather than in every
 * component that draws one.
 */
export const definitionKinds = {
  application: {
    accent: "#8e44ad",
    ink: { dark: "#d2a2e6", light: "#6c3483" },
    label: "Application",
  },
  job: { accent: "#1976d2", ink: { dark: "#90caf9", light: "#1565c0" }, label: "Job" },
  workflow: { accent: "#f1c40f", ink: { dark: "#f3d774", light: "#7d6206" }, label: "Workflow" },
} as const satisfies Record<DefinitionKind, DefinitionKindIdentity>;

/**
 * The kind's colour as text, in whichever colour scheme is showing. The pair is applied through the
 * theme rather than branched on in JavaScript, so choosing a scheme stays a CSS variable swap and
 * nothing has to re-render to follow it.
 */
export const definitionKindInk = (kind: DefinitionKind) => (theme: Theme) => ({
  color: definitionKinds[kind].ink.light,
  ...theme.applyStyles("dark", { color: definitionKinds[kind].ink.dark }),
});
