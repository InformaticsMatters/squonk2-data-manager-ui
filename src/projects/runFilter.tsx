import { DefinitionKindIcon } from "../components/kindIcons";
import { type RunFilterType } from "./routes";
import { type SectionFilterControl } from "./SectionToolbar";

/** Run's type filter, shared with its skeleton so the toolbar it shows is the one that arrives. */
export const runFilter: SectionFilterControl<RunFilterType> = {
  label: "Filter",
  options: [
    {
      icon: <DefinitionKindIcon fontSize="small" kind="workflow" />,
      label: "Workflows",
      value: "workflow",
    },
    {
      icon: <DefinitionKindIcon fontSize="small" kind="application" />,
      label: "Applications",
      value: "application",
    },
    { icon: <DefinitionKindIcon fontSize="small" kind="job" />, label: "Jobs", value: "job" },
  ],
  size: { md: 4, sm: 6, xs: 12 },
};
