/**
 * PROTOTYPE — throwaway wiring for issue #1979. The real strip is the `default` arm below; the
 * other arms are project-selector variants, switched from the floating bar with `#variant=B` and
 * the arrow keys. Restore this file from `dev` when the prototype has answered its question.
 */
import { Box, Stack } from "@mui/material";
import { useRouter } from "next/router";

import { ProjectHeading } from "../../projects/ProjectHeading";
import { projectLinks } from "../../projects/routes";
import { useRouteProjectId } from "../../projects/useRouteProject";
import {
  type PrototypeVariant,
  PrototypeVariantBar,
  usePrototypeVariant,
} from "../../prototype/PrototypeVariantBar";
import {
  ProjectBreadcrumbVariant,
  ProjectDropdownVariant,
  ProjectPaletteVariant,
  ProjectPanelVariant,
} from "./prototype/ProjectSelectorVariants";
import { NavigationTab } from "./NavigationTab";

const projectSections = [
  { key: "files", label: "Files" },
  { key: "run", label: "Run" },
  { key: "results", label: "Results" },
  { key: "manage", label: "Manage" },
] as const;

const variants: PrototypeVariant[] = [
  { key: "current", name: "Today — static identity" },
  { key: "A", name: "Anchored dropdown — recents + keys" },
  { key: "B", name: "Command palette" },
  { key: "C", name: "Breadcrumb cascade" },
  { key: "D", name: "Expanding panel" },
];

export const ProjectNavigation = () => {
  const router = useRouter();
  const projectId = useRouteProjectId();
  const { select, variant } = usePrototypeVariant(variants);

  if (!projectId) {
    return null;
  }

  const bar = <PrototypeVariantBar current={variant} variants={variants} onSelect={select} />;

  if (variant === "A") {
    return (
      <>
        <ProjectDropdownVariant projectId={projectId} />
        {bar}
      </>
    );
  }
  if (variant === "B") {
    return (
      <>
        <ProjectPaletteVariant projectId={projectId} />
        {bar}
      </>
    );
  }
  if (variant === "C") {
    return (
      <>
        <ProjectBreadcrumbVariant projectId={projectId} />
        {bar}
      </>
    );
  }
  if (variant === "D") {
    return (
      <>
        <ProjectPanelVariant projectId={projectId} />
        {bar}
      </>
    );
  }

  return (
    <>
      <Stack
        direction={{ xs: "column", md: "row" }}
        // The strip sits inside the application bar but is not part of it: it keeps the page's own
        // surface and text colour rather than inheriting the bar's.
        sx={{
          alignItems: { md: "center" },
          bgcolor: "background.paper",
          borderBottom: 1,
          borderColor: "divider",
          color: "text.primary",
          px: 2,
        }}
      >
        <Box sx={{ minWidth: 260, py: 1 }}>
          <ProjectHeading projectId={projectId} />
        </Box>
        <Stack
          aria-label="Project"
          component="nav"
          direction="row"
          sx={{ ml: { md: "auto" }, overflowX: "auto" }}
        >
          {projectSections.map(({ key, label }) => {
            const href = projectLinks[key](projectId);
            return (
              <NavigationTab
                active={router.asPath.startsWith(href)}
                href={href}
                key={key}
                label={label}
              />
            );
          })}
        </Stack>
      </Stack>
      {bar}
    </>
  );
};
