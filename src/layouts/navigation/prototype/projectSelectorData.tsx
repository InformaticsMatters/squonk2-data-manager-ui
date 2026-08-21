/**
 * PROTOTYPE — throwaway. Delete with the variants that use it.
 *
 * The facts every project-selector variant needs, and the one rule they all obey: choosing a
 * project is a *navigation*. Every variant hands out an href built by `projectLinks`, so the URL
 * stays the single source of which project is displayed and the page renders only once the new
 * route has resolved and authorised. Nothing here holds a selected project.
 */
import { useEffect, useMemo, useState } from "react";

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

/* ------------------------------------------------------------------ *
 * PROTOTYPE-ONLY padding.
 *
 * The question asked of the selector — does it still work at a hundred projects? — cannot be
 * answered by a development environment holding five. `#variant=A&pad=100` inflates the list with
 * synthetic projects that borrow the real ones' units and organisations, so search, recents and
 * the keyboard are exercised at a size worth judging. The hash is used rather than a query
 * parameter for the same reason the variant bar uses it: the Projects family canonicalises the
 * search string and would strip an unknown one straight back out.
 * ------------------------------------------------------------------ */
const padStems = [
  "Aldehyde screen",
  "Binding poses",
  "Covalent hits",
  "Docking sweep",
  "Enamine subset",
  "Fragment growth",
  "Hit triage",
  "Kinase panel",
  "Ligand prep",
  "Metabolite scan",
  "Pharmacophore fit",
  "Scaffold hop",
  "Selectivity study",
  "Toxicity filter",
];

const useProjectPadding = () => {
  // Read after mount, never during: the first render has to match the server's.
  const [target, setTarget] = useState(0);
  useEffect(() => {
    const read = () => {
      const value = new URLSearchParams(globalThis.location.hash.replace(/^#/u, "")).get("pad");
      setTarget(Number.parseInt(value ?? "", 10) || 0);
    };
    read();
    globalThis.addEventListener("hashchange", read);
    return () => globalThis.removeEventListener("hashchange", read);
  }, []);
  return target;
};

/**
 * Shape-valid IDs, because `projectLinks` asserts every ID it is handed against the generated
 * `project-<uuid>` pattern and throws on anything else — so a padded row with a made-up ID would
 * take the page down as its href was built. `feed…` marks them as synthetic to the naked eye.
 */
const padProjectId = (index: number) =>
  `project-feed0000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;

const padProjects = (items: SelectorProject[], target: number) => {
  if (items.length >= target) {
    return items;
  }
  const homes: Pick<SelectorProject, "organisationId" | "organisationName" | "unitName">[] =
    items.length > 0
      ? items
      : [
          {
            organisationId: "org-prototype",
            organisationName: "Example organisation",
            unitName: "Example unit",
          },
        ];
  const extras = Array.from({ length: target - items.length }, (_, index) => {
    const home = homes[index % homes.length];
    const run = Math.floor(index / padStems.length) + 1;
    return {
      name: `${padStems[index % padStems.length]} ${String(run).padStart(2, "0")}`,
      organisationId: home.organisationId,
      organisationName: home.organisationName,
      projectId: padProjectId(index),
      unitName: home.unitName,
    };
  });
  return [...items, ...extras];
};

/** Every project the caller can reach, with the unit and organisation that contain it. */
export const useSelectorProjects = () => {
  const { data: projects, isPending: projectsArePending } = useGetProjects();
  const { data: units } = useGetUnits();
  const padding = useProjectPadding();

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
    const found = projects.projects.map((project) => ({
      name: project.name,
      organisationId: project.organisation_id ?? "",
      organisationName:
        organisationNames.get(project.organisation_id ?? "") ?? "Unknown organisation",
      projectId: project.project_id,
      unitName: unitNames.get(project.unit_id ?? "") ?? "Unknown unit",
    }));
    return padProjects(found, padding).toSorted((left, right) =>
      left.name.localeCompare(right.name),
    );
  }, [padding, projects, units]);

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
