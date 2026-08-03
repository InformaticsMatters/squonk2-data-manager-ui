import { type ReactNode, useEffect } from "react";

import { useGetOrganisation } from "@/api/account-server/organisation";

import { CenterLoader } from "../components/CenterLoader";
import { useSelectedOrganisation } from "../state/organisationSelection";
import { recordRecentProject } from "./recentProjects";
import { useRouteProject } from "./useRouteProject";

export const ProjectOrganisationBoundary = ({ children }: { children: ReactNode }) => {
  const { project, projectId } = useRouteProject();
  const [, setOrganisation, organisationId] = useSelectedOrganisation();
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
