import { type ReactNode, useEffect } from "react";

import { useGetOrganisation } from "@/api/account-server/organisation";
import { useGetProject } from "@/api/data-manager/project";

import { useRouter } from "next/router";

import { CenterLoader } from "../components/CenterLoader";
import { useSelectedOrganisation } from "../state/organisationSelection";
import { recordRecentProject } from "./recentProjects";

export const ProjectOrganisationBoundary = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const projectId = typeof router.query.projectId === "string" ? router.query.projectId : undefined;
  const [, setOrganisation, organisationId] = useSelectedOrganisation();
  const { data: project } = useGetProject(projectId ?? "", { query: { enabled: !!projectId } });
  const owningOrganisationId = project?.organisation_id;
  const { data: owningOrganisation } = useGetOrganisation(owningOrganisationId ?? "", {
    query: { enabled: !!owningOrganisationId && owningOrganisationId !== organisationId },
  });

  useEffect(() => {
    if (projectId && project) {
      recordRecentProject(localStorage, projectId);
    }
  }, [project, projectId]);

  useEffect(() => {
    if (owningOrganisation && owningOrganisation.id !== organisationId) {
      setOrganisation(owningOrganisation);
    }
  }, [organisationId, owningOrganisation, setOrganisation]);

  if (projectId && (!project || owningOrganisationId !== organisationId)) {
    return <CenterLoader />;
  }

  return children;
};
