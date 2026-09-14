import { useDeferredValue, useState } from "react";

import { useGetDefaultOrganisation } from "@/api/account-server/organisation";
import { useGetUnitsSuspense } from "@/api/account-server/unit";
import { useGetProjectsSuspense } from "@/api/data-manager/project";

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Container,
  List,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

import { useFamilyRoute } from "../../application/FamilyRouteResolution";
import { useClientSnapshot } from "../../hooks/useClientSnapshot";
import { useDraftValue } from "../../hooks/useDraftValue";
import { useGetPersonalUnit } from "../../hooks/useGetPersonalUnit";
import { useKeycloakUser } from "../../hooks/useKeycloakUser";
import {
  dismissProjectOnboarding,
  projectOnboardingIsDismissed,
} from "../../projects/onboardingDismissal";
import {
  buildProjectIndexList,
  decideProjectOnboarding,
  type ProjectIndexUnitOption,
  unitNamesInOrganisation,
} from "../../projects/projectIndex";
import { ProjectIndexRow } from "../../projects/ProjectIndexRow";
import { ProjectOnboarding } from "../../projects/ProjectOnboarding";
import { type ProjectIndexLinkState, projectLinks } from "../../projects/routes";
import { UnitOffer } from "../../projects/UnitOffer";
import { useSelectedOrganisation } from "../../state/organisationSelection";

export const ProjectsIndex = () => {
  const router = useRouter();
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;
  const routeSearch = route?.kind === "index" ? route.search : undefined;
  /**
   * The unit filter is not typed into, so it needs no draft of its own: the URL is the state, read
   * directly and rewritten on every change.
   *
   * Only the Projects index carries a unit, and this screen is only ever mounted beneath it, so the
   * property the route declares is what tells the two families' indexes apart here.
   */
  const routeUnitId = route?.kind === "index" && "unitId" in route ? route.unitId : undefined;
  const [search, setSearch] = useDraftValue(routeSearch ?? "");
  const deferredSearch = useDeferredValue(search);
  const selectedOrganisation = useSelectedOrganisation();
  const organisationId = selectedOrganisation[2];
  const { data: projects } = useGetProjectsSuspense();
  const { data: units } = useGetUnitsSuspense();
  const { user } = useKeycloakUser();
  const { data: personalUnit, isPending: personalUnitIsPending } = useGetPersonalUnit();
  const { data: defaultOrganisation } = useGetDefaultOrganisation({ query: { retry: false } });
  // The dismissal is read in the browser only, because the server render has no browser storage to
  // read and a panel that appeared and then vanished would be worse than one that arrives late.
  const storedDismissal = useClientSnapshot(
    () => projectOnboardingIsDismissed(localStorage),
    false,
  );
  // Dismissing writes to storage, which nothing re-reads on its own, so this render also remembers
  // that it was this caller who just did it.
  const [dismissedHere, setDismissedHere] = useState(false);
  const dismissed = storedDismissal || dismissedHere;
  // Latched, not read live. A personal unit that has not answered *yet* is not an absent one, and
  // the two are opposite answers here — but once it has answered, a later refresh of the same read
  // must not take the offer back off the screen the caller is working through.
  const [personalUnitHasAnswered, setPersonalUnitHasAnswered] = useState(false);
  if (!personalUnitIsPending && !personalUnitHasAnswered) {
    setPersonalUnitHasAnswered(true);
  }

  const { items, selectedUnit, unitOptions } = organisationId
    ? buildProjectIndexList(projects.projects, units, organisationId, {
        search: deferredSearch,
        unitId: routeUnitId,
        username: user.username,
      })
    : { items: [], selectedUnit: undefined, unitOptions: [] };
  const onboarding = decideProjectOnboarding(
    projects.projects,
    user.username,
    personalUnit?.id ?? undefined,
  );
  /**
   * The offer belongs to the organisation it would create in. A personal unit lives in the default
   * organisation and the project the second step makes lives inside that unit, so this index — which
   * lists one organisation at a time — would otherwise offer a caller working as some other
   * organisation a project that could not appear in the list they are looking at.
   */
  const worksAsDefaultOrganisation =
    defaultOrganisation?.id !== undefined && organisationId === defaultOrganisation.id;
  /**
   * Offering onboarding before the personal unit has answered would flash the panel at every caller
   * who already has one, and the panel treats the step it is shown at mount as the one that
   * applies. A caller with no personal unit is an authoritative `404` rather than a pending read,
   * so nothing here waits longer than the one read it depends on.
   */
  const offersOnboarding =
    worksAsDefaultOrganisation &&
    personalUnitHasAnswered &&
    onboarding.offered &&
    !(onboarding.dismissible && dismissed);
  const dismiss = () => {
    dismissProjectOnboarding(localStorage);
    setDismissedHere(true);
  };
  // Whether this organisation holds a project at all — not whether the caller has one somewhere, and
  // not whether their search matched: with no list for the offer to sit above, an empty index beside
  // it would be two empty-state messages competing for the same attention, while a search that
  // matched nothing is still a search of a list that is there.
  const onboardingIsTheIndex =
    offersOnboarding &&
    !projects.projects.some((project) => project.organisation_id === organisationId);

  /**
   * Both controls write the whole narrowing, so neither can drop what the other put in the URL.
   * Replace rather than push, which is what every other filtered list in the application does: a
   * narrowing is a view of the screen the caller is already on rather than somewhere they went, so
   * leaving the index does not mean stepping back out through each narrowing on the way.
   */
  const narrowTo = (state: ProjectIndexLinkState) => {
    void router.replace(projectLinks.index(state) as never, undefined, { shallow: true });
  };
  const updateSearch = (value: string) => {
    setSearch(value);
    // The unit written back is the one in effect rather than the one the URL named, so a filter
    // that named a unit with no visible project is dropped as soon as the caller uses the screen.
    narrowTo({ search: value || undefined, unitId: selectedUnit?.unitId });
  };
  const updateUnit = (option: ProjectIndexUnitOption | null) => {
    narrowTo({ search: search || undefined, unitId: option?.unitId });
  };

  const panel = offersOnboarding ? (
    <ProjectOnboarding
      decision={onboarding}
      personalUnit={personalUnit}
      {...(onboarding.dismissible ? { onDismiss: dismiss } : {})}
    />
  ) : null;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* An offer made alongside a list goes above the workspace heading, so the heading, the
          search field and the list it describes are not split apart by it. Where the offer is the
          whole index there is no list to separate, and the heading stays above the content it
          titles. */}
      {panel && !onboardingIsTheIndex ? <Box sx={{ mb: 3 }}>{panel}</Box> : null}
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
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{ alignItems: { sm: "flex-start" }, gap: 2 }}
          >
            {/* The panel already offers the caller their unit, and one screen states a thing once,
                so the header stands aside for exactly as long as the panel is up. Dismissing the
                panel takes away the explanation, not the action. */}
            {offersOnboarding ? null : (
              <UnitOffer
                existingUnitNames={
                  organisationId ? unitNamesInOrganisation(units, organisationId) : []
                }
                organisationId={organisationId}
              />
            )}
            <Button component={Link} href={projectLinks.create()} variant="contained">
              Create project
            </Button>
          </Stack>
        )}
      </Stack>
      {onboardingIsTheIndex ? panel : null}
      {onboardingIsTheIndex ? null : (
        <>
          <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 2 }}>
            <TextField
              fullWidth
              label="Search projects"
              placeholder="Project or containing unit"
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
            />
            {/* The options are exactly the units holding a project on this screen, each counted, so
                the caller can see what a filter will do before applying it and no choice they are
                offered can empty the list. */}
            <Autocomplete
              // Typing finds a unit by its name: the count is what an option would do rather than
              // part of what it is called, so it is rendered beside the name and not matched on.
              getOptionLabel={({ unitName }) => unitName}
              isOptionEqualToValue={(option, value) => option.unitId === value.unitId}
              options={unitOptions}
              renderInput={(params) => <TextField {...params} label="Unit" />}
              renderOption={({ key, ...optionProps }, { count, unitName }) => (
                <Box component="li" key={key} {...optionProps} sx={{ gap: 1 }}>
                  {unitName}
                  <Typography color="text.secondary" component="span" variant="body2">
                    ({count})
                  </Typography>
                </Box>
              )}
              sx={{ minWidth: { sm: 260 } }}
              value={selectedUnit ?? null}
              onChange={(_event, option) => updateUnit(option)}
            />
          </Stack>
          {items.length > 0 ? (
            <List sx={{ mt: 2 }}>
              {items.map((item) => (
                <ProjectIndexRow key={item.project.project_id} {...item} />
              ))}
            </List>
          ) : (
            /* A unit filter alone can never empty the list, so an empty filtered list is always a
               search that matched nothing inside the unit — which the message names, and offers a
               way out of where the emptiness is reported. */
            <Alert
              action={
                selectedUnit ? (
                  <Button color="inherit" size="small" onClick={() => updateUnit(null)}>
                    Show all units
                  </Button>
                ) : undefined
              }
              severity="info"
              sx={{ mt: 2 }}
            >
              {selectedUnit
                ? `No projects match this search in ${selectedUnit.unitName}.`
                : search
                  ? "No projects match this search in the current organisation."
                  : "No projects are available in the current organisation."}
            </Alert>
          )}
        </>
      )}
    </Container>
  );
};
