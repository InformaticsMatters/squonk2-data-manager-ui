import { useMemo } from "react";

import { useGetOrganisations } from "@/api/account-server/organisation";
import { useGetUnits } from "@/api/account-server/unit";
import { useGetProjects } from "@/api/data-manager/project";

import { useKeycloakUser } from "../hooks/useKeycloakUser";
import { type AttachmentTarget, eligibleAttachmentTargets } from "./attachment";
import {
  type DatasetCapability,
  type DatasetMembershipReadState,
  evaluateDatasetAttachmentCapability,
} from "./capabilities";

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
    isLoadingError: projectsUnread,
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

  // A project read that failed is a different fact from one still arriving: it will not answer on
  // its own, so the caller is told to reload rather than to wait for a confirmation that is not
  // coming. Only a read that never answered leaves the targets unknown — a refresh that failed over
  // targets already read leaves them usable — and whether the caller themselves is known is still
  // only ever a matter of waiting.
  const freshness: DatasetMembershipReadState = projectsUnread
    ? "unavailable"
    : isUserLoading || !user.username || projectsPending
      ? "stale"
      : "current";

  return {
    capability: evaluateDatasetAttachmentCapability({
      eligibleTargetCount: targets.length,
      freshness,
    }),
    targets,
  };
};
