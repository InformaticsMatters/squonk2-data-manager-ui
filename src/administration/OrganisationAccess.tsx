import { useState } from "react";

import { type OrganisationAllDetail } from "@/api/account-server";

import { Box, Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";

import { CreateResourceModal, task, unitTypeLabel } from "./accessControls";
import { useAccessFacts, useAccessIndex } from "./accessFacts";
import {
  evaluateOrganisationCreationCapability,
  isDefaultOrganisationResource,
} from "./capabilities";
import { administrationResourceLabel } from "./failures";
import { assertOrganisationId, assertUnitId } from "./identifiers";
import { AddressedOrganisation } from "./OrganisationResource";
import { CapabilityAction, EmptyTask, PageTitle, ResourceLink } from "./resources";
import { administrationLinks, type AdministrationRoute } from "./routes";
import { AddressedUnit } from "./UnitResource";
import { useAccessCommands } from "./useAccessCommands";
import { useAdministrationCommandFeedback } from "./useAdministrationFeedback";

export type OrganisationAccessResourceRoute = Extract<
  AdministrationRoute,
  { kind: "organisation-access-resource" }
>;

const CreateOrganisationAction = ({
  organisations,
}: {
  organisations: OrganisationAllDetail[];
}) => {
  const [open, setOpen] = useState(false);
  const { caller } = useAccessFacts();
  const commands = useAccessCommands();
  const feedback = useAdministrationCommandFeedback();
  const router = useRouter();
  const capability = evaluateOrganisationCreationCapability(caller);
  const owner = caller.username;

  // The capability is only enabled once the generated caller account names an owner to create for.
  if (capability.status === "hidden" || owner === undefined) {
    return null;
  }

  const create = async (created: { name: string; owner: string }) => {
    try {
      const { id } = await commands.createOrganisation(created);
      feedback.announce("Organisation created");
      setOpen(false);
      await router.push(
        administrationLinks.organisationAccessResource(
          "organisations",
          assertOrganisationId(id),
        ) as never,
      );
    } catch (error) {
      feedback.report(error, "create", administrationResourceLabel.newOrganisation);
    }
  };

  return (
    <>
      <CapabilityAction capability={capability}>
        {({ disabled }) => (
          <Button disabled={disabled} variant="outlined" onClick={() => setOpen(true)}>
            Create organisation
          </Button>
        )}
      </CapabilityAction>
      <CreateResourceModal
        defaultOwner={owner}
        existingNames={organisations.map((organisation) => organisation.name)}
        id="create-organisation"
        open={open}
        subject="organisation"
        title="Create organisation"
        onClose={() => setOpen(false)}
        onSubmit={create}
      />
    </>
  );
};

export const OrganisationAccessIndex = () => {
  const { organisations, units } = useAccessIndex();
  const { defaultOrganisationId, personalUnitId } = useAccessFacts();

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Select an organisation or unit to manage it. Every lifecycle action belongs to the resource
        in the address bar.
      </Typography>
      <Box sx={{ mb: 3 }}>
        <CreateOrganisationAction organisations={organisations} />
      </Box>
      {organisations.length === 0 && units.length === 0 ? (
        <EmptyTask>
          No organisations or units are available. Organisation or unit membership is required to
          manage a resource.
        </EmptyTask>
      ) : (
        <Stack spacing={2}>
          {organisations.map((organisation) => (
            <ResourceLink
              href={administrationLinks.organisationAccessResource(
                "organisations",
                assertOrganisationId(organisation.id),
              )}
              id={organisation.id}
              key={organisation.id}
              name={organisation.name}
              type={
                isDefaultOrganisationResource(organisation.id, defaultOrganisationId)
                  ? "Default organisation"
                  : "Organisation"
              }
            />
          ))}
          {units.map(({ organisation, unit }) => (
            <ResourceLink
              ancestry={organisation.name}
              href={administrationLinks.organisationAccessResource("units", assertUnitId(unit.id))}
              id={unit.id}
              key={unit.id}
              name={unit.name}
              type={unitTypeLabel(unit.id, personalUnitId)}
            />
          ))}
        </Stack>
      )}
    </>
  );
};

/**
 * The resource in the address bar answers for itself through its own generated resource, so a
 * resource the caller may read but does not list keeps its identity, and a denial and an absence
 * are told apart by the Administration failure contract rather than by index membership.
 */
export const OrganisationAccessResource = ({
  route,
}: {
  route: OrganisationAccessResourceRoute;
}) =>
  route.collection === "organisations" ? (
    <AddressedOrganisation organisationId={route.resourceId} />
  ) : (
    <AddressedUnit unitId={route.resourceId} />
  );
