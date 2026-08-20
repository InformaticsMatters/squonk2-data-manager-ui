/**
 * PROTOTYPE — throwaway. Delete with the variants that use it.
 *
 * The facts every project-selector variant needs, and the one rule they all obey: choosing a
 * project is a *navigation*. Every variant hands out an href built by `projectLinks`, so the URL
 * stays the single source of which project is displayed and the page renders only once the new
 * route has resolved and authorised. Nothing here holds a selected project.
 */
import { useMemo } from "react";

import { useGetUnits } from "@/api/account-server/unit";
import { useGetProjects } from "@/api/data-manager/project";

import { projectLinks } from "../../../projects/routes";

export interface SelectorProject {
  name: string;
  organisationId: string;
  organisationName: string;
  projectId: string;
  unitName: string;
}

export const projectSections = [
  { key: "files", label: "Files" },
  { key: "run", label: "Run" },
  { key: "results", label: "Results" },
  { key: "manage", label: "Manage" },
] as const;

export type ProjectSectionKey = (typeof projectSections)[number]["key"];

export const sectionHref = (section: ProjectSectionKey, projectId: string) =>
  ({
    files: projectLinks.files,
    manage: projectLinks.manage,
    results: projectLinks.results,
    run: projectLinks.run,
  })[section](projectId);

/**
 * The section the caller is standing in, read from the URL rather than remembered. A deeper child
 * — one result, one file view — answers as its own section, so "stay where I am" can only ever
 * mean the section, never a child of the new project that may not exist.
 */
export const currentSection = (asPath: string, projectId: string): ProjectSectionKey => {
  const found = projectSections.find(({ key }) =>
    asPath.startsWith(`/projects/${projectId}/${key}`),
  );
  return found?.key ?? "files";
};

/** Every project the caller can reach, with the unit and organisation that contain it. */
export const useSelectorProjects = () => {
  const { data: projects, isPending: projectsArePending } = useGetProjects();
  const { data: units } = useGetUnits();

  const items = useMemo<SelectorProject[]>(() => {
    if (!projects) {
      return [];
    }
    const organisationNames = new Map<string, string>();
    const unitNames = new Map<string, string>();
    for (const group of units?.units ?? []) {
      organisationNames.set(group.organisation.id, group.organisation.name);
      for (const unit of group.units) {
        unitNames.set(unit.id, unit.name);
      }
    }
    return projects.projects
      .map((project) => ({
        name: project.name,
        organisationId: project.organisation_id ?? "",
        organisationName:
          organisationNames.get(project.organisation_id ?? "") ?? "Unknown organisation",
        projectId: project.project_id,
        unitName: unitNames.get(project.unit_id ?? "") ?? "Unknown unit",
      }))
      .toSorted((left, right) => left.name.localeCompare(right.name));
  }, [projects, units]);

  return { items, isPending: projectsArePending };
};

export const matchesSearch = (project: SelectorProject, search: string) => {
  const term = search.trim().toLocaleLowerCase();
  return (
    !term ||
    project.name.toLocaleLowerCase().includes(term) ||
    project.unitName.toLocaleLowerCase().includes(term) ||
    project.organisationName.toLocaleLowerCase().includes(term)
  );
};
