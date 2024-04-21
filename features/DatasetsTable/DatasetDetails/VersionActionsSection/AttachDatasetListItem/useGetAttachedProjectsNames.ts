import { type ProjectDetail } from "@squonk/data-manager-client";

/**
 * Resolves names of the projects a dataset version is attached to. Since a user might not have
 * enough permissions to view information about every project the dataset version is attached to,
 * information about the amount of such projects is listed as the last item in the returning array.
 */
export const useGetAttachedProjectsNames = (projectIds: string[], projects?: ProjectDetail[]) => {
  if (projects) {
    const names: string[] = [];

    projects.forEach((project) => {
      const { name, project_id } = project;
      if (projectIds.includes(project_id)) {
        names.push(name);
      }
    });

    // If the size of the project names differ, it means the requesting user doesn't have enough
    // permissions to see them. Display the difference as hidden projects.
    const sizeDifference = projectIds.length - names.length;
    if (sizeDifference) {
      // In case all of the projects are hidden from the user, displays only the number instead
      // of `and 5 hidden`
      const prefix = names.length > 0 ? "and " : "";
      names.push(`${prefix}${sizeDifference} hidden`);
    }
    return names;
  }
  return [];
};
