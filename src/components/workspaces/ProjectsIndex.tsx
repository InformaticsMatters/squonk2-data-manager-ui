import { useDeferredValue, useEffect, useState } from "react";

import { useGetUnitsSuspense } from "@/api/account-server/unit";
import { useGetProjectsSuspense } from "@/api/data-manager/project";

import {
  Alert,
  Button,
  Container,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

import { useFamilyRoute } from "../../application/FamilyRouteResolution";
import { useGetPersonalUnit } from "../../hooks/useGetPersonalUnit";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import {
  dismissProjectOnboarding,
  projectOnboardingIsDismissed,
} from "../../projects/onboardingDismissal";
import { ProjectIdentity } from "../../projects/ProjectIdentity";
import { buildProjectIndexItems, decideProjectOnboarding } from "../../projects/projectIndex";
import { ProjectOnboarding } from "../../projects/ProjectOnboarding";
import { projectLinks } from "../../projects/routes";
import { useSelectedOrganisation } from "../../state/organisationSelection";

export const ProjectsIndex = () => {
  const router = useRouter();
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;
  const routeSearch = route?.kind === "index" ? route.search : undefined;
  const [search, setSearch] = useState(routeSearch ?? "");
  const deferredSearch = useDeferredValue(search);
  const selectedOrganisation = useSelectedOrganisation();
  const organisationId = selectedOrganisation[2];
  const { data: projects } = useGetProjectsSuspense();
  const { data: units } = useGetUnitsSuspense();
  const { user } = useKeycloakUser();
  const { data: personalUnit, isPending: personalUnitIsPending } = useGetPersonalUnit();
  const [dismissed, setDismissed] = useState(false);
  const [personalUnitHasAnswered, setPersonalUnitHasAnswered] = useState(false);

  useEffect(() => setSearch(routeSearch ?? ""), [routeSearch]);
  // The dismissal is read after mount, because the server render has no browser storage to read and
  // a panel that appeared and then vanished would be worse than one that arrives a frame late.
  useEffect(() => setDismissed(projectOnboardingIsDismissed(localStorage)), []);
  // Latched, not read live. A personal unit that has not answered *yet* is not an absent one, and
  // the two are opposite answers here — but once it has answered, a later refresh of the same read
  // must not take the offer back off the screen the caller is working through.
  useEffect(() => {
    if (!personalUnitIsPending) {
      setPersonalUnitHasAnswered(true);
    }
  }, [personalUnitIsPending]);

  const items = organisationId
    ? buildProjectIndexItems(projects.projects, units, organisationId, deferredSearch)
    : [];
  const onboarding = decideProjectOnboarding(
    projects.projects,
    user.username,
    personalUnit?.id ?? undefined,
  );
  /**
   * Offering onboarding before the personal unit has answered would flash the panel at every caller
   * who already has one, and the panel treats the step it is shown at mount as the one that
   * applies. A caller with no personal unit is an authoritative `404` rather than a pending read,
   * so nothing here waits longer than the one read it depends on.
   */
  const offersOnboarding =
    personalUnitHasAnswered && onboarding.offered && !(onboarding.dismissible && dismissed);
  const dismiss = () => {
    dismissProjectOnboarding(localStorage);
    setDismissed(true);
  };
  // Whether the caller has any project at all, which is a different question from whether they have
  // one they can work in: with no project to sit above, an empty index beside an offer would be two
  // empty-state messages competing for the same attention.
  const onboardingIsTheIndex = offersOnboarding && projects.projects.length === 0;

  const updateSearch = (value: string) => {
    setSearch(value);
    void router.replace(projectLinks.index({ search: value || undefined }) as never, undefined, {
      shallow: true,
    });
  };

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ alignItems: { sm: "flex-end" }, gap: 2, justifyContent: "space-between", mb: 3 }}
      >
        <div>
          <Typography component="h1" variant="h3">
            Projects
          </Typography>
          {/* The caption tells the caller what to do with a list. Where the offer is the screen
              there is no list, and the offer says what to do instead. */}
          {onboardingIsTheIndex ? null : (
            <Typography color="text.secondary">
              Choose a project before project resources are displayed.
            </Typography>
          )}
        </div>
        {onboardingIsTheIndex ? null : (
          <Button component={Link} href={projectLinks.create()} variant="contained">
            Create project
          </Button>
        )}
      </Stack>
      {offersOnboarding ? (
        <ProjectOnboarding
          decision={onboarding}
          personalUnit={personalUnit}
          {...(onboarding.dismissible ? { onDismiss: dismiss } : {})}
        />
      ) : null}
      {onboardingIsTheIndex ? null : (
        <>
          <TextField
            fullWidth
            label="Search projects"
            placeholder="Project or containing unit"
            sx={{ mt: offersOnboarding ? 3 : 0 }}
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
          />
          {items.length > 0 ? (
            <List sx={{ mt: 2 }}>
              {items.map(({ organisationName, project, unitName }) => (
                <ListItemButton
                  component={Link}
                  href={projectLinks.files(project.project_id) as never}
                  key={project.project_id}
                >
                  <ListItemText
                    primary={project.name}
                    secondary={
                      <ProjectIdentity organisationLabel={organisationName} unitLabel={unitName} />
                    }
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              {search
                ? "No projects match this search in the current organisation."
                : "No projects are available in the current organisation."}
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};
