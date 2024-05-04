import { type ProjectDetail } from "@squonk/data-manager-client";

export const PERMISSION_LEVELS = ["none", "editor", "administrator"] as const;

export const isAPermissionLevel = (value: string): value is PermissionLevel => {
  return (PERMISSION_LEVELS as unknown as string[]).includes(value);
};

export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];
export type PermissionLevelFilter =
  | [(typeof PERMISSION_LEVELS)[0], undefined]
  | [(typeof PERMISSION_LEVELS)[0]]
  | [level: PermissionLevel, user: string];

export const filterProjectsByPermissionLevel = (
  level: PermissionLevelFilter[0],
  user: PermissionLevelFilter[1],
  projects: ProjectDetail[],
) => {
  if (!user) {
    return projects;
  }

  switch (level) {
    case "editor":
      return projects.filter(
        (project) => project.editors.includes(user) || project.administrators.includes(user),
      );

    case "administrator":
      return projects.filter((project) => project.administrators.includes(user));

    default:
      return projects;
  }
};
