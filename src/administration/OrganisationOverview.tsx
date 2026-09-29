import { useState } from "react";

import { type OrganisationAllDetail } from "@/api/account-server";
import { useGetOrganisations } from "@/api/account-server/organisation";
import { useGetOrganisationUnits } from "@/api/account-server/unit";

import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";

import { useUnitCreationFacts } from "../hooks/useUnitCreationFacts";
import { CreateResourceModal, DefaultPrivacySelect, ManageResourceUsers } from "./accessControls";
import { retryAdministrationRead, useAccessFacts, useAddressedOrganisation } from "./accessFacts";
import { UnitListPanel } from "./AdministrationRail";
import {
  type AdministrationCapability,
  evaluateOrganisationCreationCapability,
  evaluateOrganisationMembershipCapability,
  evaluateOrganisationPrivacyCapability,
  evaluatePersonalUnitCreationCapability,
  evaluateUnitCreationCapability,
  protectedOrganisationMembers,
} from "./capabilities";
import { administrationResourceLabel } from "./failures";
import { useAdoptOrganisation } from "./organisationInEffect";
import { declaredProductPrivacyExplanation } from "./privacy";
import { AddressedResourceView, CapabilityAction, PageTitle, Section } from "./resources";
import { administrationLinks } from "./routes";
import { organisationInEffectIsDefault } from "./scope";
import { useAccessCommands } from "./useAccessCommands";
import { useAdministrationCommandFeedback } from "./useAdministrationFeedback";

/**
 * Creates a unit in the organisation already in effect. There is no organisation picker, and that
 * absence is the point: the organisation is ambient, so the action needs no second answer to a
 * question the masthead has already answered — which is what closes the discoverability gap that
 * hid unit creation behind an addressed organisation resource.
 */
const CreateUnitAction = ({
  capability,
  existingNames,
  organisationId,
}: {
  capability: AdministrationCapability;
  existingNames: string[];
  organisationId: string;
}) => {
  const [open, setOpen] = useState(false);
  const commands = useAccessCommands();
  const feedback = useAdministrationCommandFeedback();
  const router = useRouter();

  const create = async ({ name }: { name: string }) => {
    try {
      const { id } = await commands.createUnit(organisationId, name);
      feedback.announce("Unit created");
      setOpen(false);
      await router.push(administrationLinks.unitAccess(id) as never);
    } catch (error) {
      feedback.report(
        error,
        "create a unit in",
        administrationResourceLabel.organisation(organisationId),
      );
    }
  };

  return (
    <>
      <CapabilityAction capability={capability}>
        {({ disabled }) => (
          <Button disabled={disabled} variant="outlined" onClick={() => setOpen(true)}>
            Create unit
          </Button>
        )}
      </CapabilityAction>
      <CreateResourceModal
        existingNames={existingNames}
        id={`create-unit-${organisationId}`}
        open={open}
        subject="unit"
        title="Create unit"
        onClose={() => setOpen(false)}
        onSubmit={create}
      />
    </>
  );
};

/**
 * The caller's own unit in the default organisation. It lives here rather than on an addressed
 * organisation page because the Account Server refuses that read to every ordinary caller: the one
 * action a brand new account needs was behind a permission they will never have.
 */
const CreatePersonalUnitAction = ({ capability }: { capability: AdministrationCapability }) => {
  const commands = useAccessCommands();
  const feedback = useAdministrationCommandFeedback();
  const router = useRouter();

  const create = async () => {
    try {
      const { id } = await commands.createPersonalUnit();
      feedback.announce("Personal unit created");
      await router.push(administrationLinks.unitAccess(id) as never);
    } catch (error) {
      feedback.report(error, "create", administrationResourceLabel.personalUnit);
    }
  };

  return (
    <CapabilityAction capability={capability}>
      {({ disabled }) => (
        <Button disabled={disabled} variant="outlined" onClick={() => void create()}>
          Create personal unit
        </Button>
      )}
    </CapabilityAction>
  );
};

/**
 * The one action with no organisation of its own. On success the masthead switches to the
 * organisation just created and the caller stays here, because an overview that did not contain it
 * would be a page about somewhere else.
 */
const CreateOrganisationAction = () => {
  const [open, setOpen] = useState(false);
  const { caller } = useAccessFacts();
  const { data: organisations } = useGetOrganisations();
  const commands = useAccessCommands();
  const feedback = useAdministrationCommandFeedback();
  const adoptOrganisation = useAdoptOrganisation();
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
      adoptOrganisation({ id });
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
        existingNames={organisations?.organisations.map(({ name }) => name) ?? []}
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

/** The organisation's own membership and default project privacy, from its addressed resource. */
const OrganisationDetail = ({ organisation }: { organisation: OrganisationAllDetail }) => {
  const commands = useAccessCommands();
  const { caller, defaultOrganisationId, freshness } = useAccessFacts();
  const facts = {
    caller,
    freshness,
    isDefaultOrganisation: organisationInEffectIsDefault(organisation.id, defaultOrganisationId),
    organisation,
  };

  return (
    <>
      <Section title="Default project privacy">
        <Stack spacing={1}>
          <DefaultPrivacySelect
            announcement="Organisation default privacy updated"
            capability={evaluateOrganisationPrivacyCapability(facts)}
            privacy={organisation.default_product_privacy}
            resource={administrationResourceLabel.organisation(organisation.id)}
            update={(privacy) =>
              commands.updateOrganisation(organisation.id, { default_product_privacy: privacy })
            }
          />
          <Typography color="text.secondary" variant="body2">
            {declaredProductPrivacyExplanation(organisation.default_product_privacy)}
          </Typography>
        </Stack>
      </Section>

      <Section title="Members">
        <ManageResourceUsers
          add={(userId) => commands.addOrganisationMember(organisation.id, userId)}
          capability={evaluateOrganisationMembershipCapability(facts)}
          disabledUsers={protectedOrganisationMembers(facts)}
          noun="Member"
          remove={(userId) => commands.removeOrganisationMember(organisation.id, userId)}
          resource={administrationResourceLabel.organisation(organisation.id)}
          title="Organisation members"
          users={organisation.users.map((user) => user.id)}
        />
      </Section>
    </>
  );
};

/**
 * The organisation in effect: what it is, what it holds, and the actions that create things inside
 * it. It is the workspace's entry, so nothing on it may depend on a read the Account Server refuses
 * an ordinary caller — the sections that do are simply absent when it does.
 */
export const OrganisationOverview = ({
  organisationId,
  organisationName,
}: {
  organisationId: string;
  organisationName: string | undefined;
}) => {
  const addressed = useAddressedOrganisation(organisationId);
  const { defaultOrganisationId, freshness, personalUnitId } = useAccessFacts();
  const creationFacts = useUnitCreationFacts(organisationId);
  const { data: group } = useGetOrganisationUnits(organisationId, {
    query: { retry: retryAdministrationRead },
  });
  const isDefaultOrganisation = organisationInEffectIsDefault(
    organisationId,
    defaultOrganisationId,
  );
  const existingUnitNames = group?.units.map(({ name }) => name) ?? [];

  return (
    <>
      <PageTitle>{organisationName ?? "Organisation"}</PageTitle>
      <Typography color="text.secondary" sx={{ mb: 1, overflowWrap: "anywhere" }} variant="body2">
        Organisation ID {organisationId}
      </Typography>

      <Stack direction={{ sm: "row", xs: "column" }} spacing={2} sx={{ mt: 2 }}>
        <CreateUnitAction
          capability={evaluateUnitCreationCapability({
            caller: creationFacts.caller,
            // An organisation no read of the caller's names establishes nothing about their
            // authority over it, which is exactly what stale facts mean to every capability.
            freshness: creationFacts.organisation === undefined ? "stale" : freshness,
            isDefaultOrganisation,
            organisation: creationFacts.organisation ?? {
              caller_is_member: false,
              id: organisationId,
            },
          })}
          existingNames={existingUnitNames}
          organisationId={organisationId}
        />
        <CreatePersonalUnitAction
          capability={evaluatePersonalUnitCreationCapability({
            freshness,
            isDefaultOrganisation,
            personalUnit: personalUnitId === undefined ? "absent" : "present",
          })}
        />
        <CreateOrganisationAction />
      </Stack>

      <AddressedResourceView
        addressed={addressed}
        // A refused organisation read costs this page its members and privacy and nothing else, so
        // a permission the caller does not have never takes away the page itself.
        degraded={() => (
          <Alert severity="info" sx={{ mt: 3 }}>
            You are not a member of this organisation, so its members and default project privacy
            are not shown.
          </Alert>
        )}
        identity={({ id }) => id}
        section="Organisation"
        subject="organisation"
      >
        {(organisation) => <OrganisationDetail organisation={organisation} />}
      </AddressedResourceView>

      {/* Below the rail's breakpoint the workspace's one selector becomes part of this page. */}
      <Box sx={{ display: { md: "none", xs: "block" } }}>
        <Section title="Units">
          <UnitListPanel organisationId={organisationId} />
        </Section>
      </Box>
    </>
  );
};
