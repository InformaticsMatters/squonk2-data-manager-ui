import type { ProjectDetail } from "@squonk/data-manager-client";

import { AccountTreeRounded as AccountTreeRoundedIcon } from "@mui/icons-material";
import { ListItemButton, ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/router";

import { useCurrentProjectId } from "../../hooks/projectHooks";

type ProjectClickActions = "select-project" | "navigate-to-project";

export interface ProjectListItemProps {
  project: ProjectDetail;
  clickAction: ProjectClickActions;
}

export const TOOLTIPS = {
  "select-project": "Select project",
  "navigate-to-project": "Go to project",
} as const satisfies Record<ProjectClickActions, string>;

export const ProjectListItem = ({ project, clickAction }: ProjectListItemProps) => {
  const { projectId, setCurrentProjectId } = useCurrentProjectId();
  const { push } = useRouter();

  const action =
    clickAction === "navigate-to-project" || projectId === project.project_id
      ? "navigate-to-project"
      : "select-project";

  const onClick = () => {
    setCurrentProjectId(project.project_id);
    if (action === "navigate-to-project") {
      push("/project");
    }
  };

  const props = {
    "navigate-to-project": {
      href: "/project",
      LinkComponent: NextLink,
    },
    "select-project": {
      onClick,
    },
  };

  return (
    <Tooltip title={TOOLTIPS[action]}>
      <ListItemButton sx={{ flexGrow: 0 }} {...props[action]}>
        <ListItemIcon sx={{ minWidth: "40px" }}>
          <AccountTreeRoundedIcon />
        </ListItemIcon>
        <ListItemText primary={project.name} />
      </ListItemButton>
    </Tooltip>
  );
};
