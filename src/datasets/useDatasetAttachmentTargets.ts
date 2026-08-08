import { useMemo } from "react";

import { useGetOrganisations } from "@/api/account-server/organisation";
import { useGetUnits } from "@/api/account-server/unit";
import { useGetProjects } from "@/api/data-manager/project";

import { useKeycloakUser } from "../hooks/useKeycloakUser";
import { type AttachmentTarget, eligibleAttachmentTargets } from "./attachment";
import { type DatasetCapability, evaluateDatasetAttachmentCapability } from "./capabilities";

/**
 * The projects this caller may attach a dataset version to, and whether attaching is available.
 *
 * Eligibility is decided by the generated project collection alone, so it spans every organisation
 * and unit the caller can edit in and no selected project, unit, or organisation narrows it. The
 * generated organisation and unit indexes are read only to name a target's ancestry: an index that
 * has not answered leaves labels degraded, never the list of targets shortened, so a caller is
 * never told they have nowhere to attach because a second service was slow.
 */
export const useDatasetAttachmentTargets = (): {
  capability: Exclude<DatasetCapability, { status: "hidden" }>;
  targets: AttachmentTarget[];
} => {
  const { user, isLoading: isUserLoading } = useKeycloakUser();
  const {
    data: projectsData,
    isError: projectsFailed,
    isPending: projectsPending,
  } = useGetProjects();
  const { data: unitsData } = useGetUnits();
  const { data: organisationsData } = useGetOrganisations();

  const targets = useMemo(
    () =>
      eligibleAttachmentTargets({
        caller: { username: user.username },
        organisations: organisationsData?.organisations ?? [],
        projects: projectsData?.projects ?? [],
        unitGroups: unitsData?.units ?? [],
      }),
    [organisationsData, projectsData, unitsData, user.username],
  );

  return {
    capability: evaluateDatasetAttachmentCapability({
      eligibleTargetCount: targets.length,
      freshness:
        isUserLoading || !user.username || projectsPending || projectsFailed ? "stale" : "current",
    }),
    targets,
  };
};
