import type { ProjectDetail } from "@squonk/data-manager-client";

export const isAPermissionLevel = (value: string): value is PermissionLevel => {
  return (PERMISSION_LEVELS as unknown as string[]).includes(value);
};

export const PERMISSION_LEVELS = ["none", "editor", "owner"] as const;
export type PermissionLevel = (typeof PERMISSION_LEVELS)[number];
export type PermissionLevelFilter =
  | [level: PermissionLevel, user: string]
  | [(typeof PERMISSION_LEVELS)[0], undefined]
  | [(typeof PERMISSION_LEVELS)[0]];

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
      return projects.filter((project) => project.editors.includes(user) || project.owner == user);

    case "owner":
      return projects.filter((project) => project.owner == user);

    default:
      return projects;
  }
};
