import { useState } from "react";

import { type OrganisationAllDetail } from "@/api/account-server";

import { Button, Stack, Typography } from "@mui/material";
import { useRouter } from "next/router";

import { type OrganisationId } from "../routing/identifiers";
import {
  CreateResourceModal,
  DefaultPrivacySelect,
  ManageResourceUsers,
  task,
  unitTypeLabel,
} from "./accessControls";
import {
  type UnitWithOrganisation,
  useAccessFacts,
  useAccessIndex,
  useAddressedOrganisation,
} from "./accessFacts";
import {
  type AdministrationCapability,
  evaluateOrganisationMembershipCapability,
  evaluateOrganisationPrivacyCapability,
  evaluatePersonalUnitCreationCapability,
  evaluateUnitCreationCapability,
  isDefaultOrganisationResource,
  protectedOrganisationMembers,
} from "./capabilities";
import { administrationResourceLabel } from "./failures";
import { assertUnitId } from "./identifiers";
import { declaredProductPrivacyExplanation } from "./privacy";
import {
  AddressedResourceView,
  CapabilityAction,
  PageTitle,
  ResourceChip,
  ResourceIdentity,
  ResourceLink,
  Section,
} from "./resources";
import { administrationLinks } from "./routes";
import { useAccessCommands } from "./useAccessCommands";
import { useAdministrationCommandFeedback } from "./useAdministrationFeedback";

const CreateUnitAction = ({
  capability,
  existingNames,
  organisation,
}: {
  capability: AdministrationCapability;
  existingNames: string[];
  organisation: OrganisationAllDetail;
}) => {
  const [open, setOpen] = useState(false);
  const commands = useAccessCommands();
  const feedback = useAdministrationCommandFeedback();
  const router = useRouter();

  const create = async ({ name }: { name: string }) => {
    try {
      const { id } = await commands.createUnit(organisation.id, name);
      feedback.announce("Unit created");
      setOpen(false);
      await router.push(
        administrationLinks.organisationAccessResource("units", assertUnitId(id)) as never,
      );
    } catch (error) {
      feedback.report(
        error,
        "create a unit in",
        administrationResourceLabel.organisation(organisation.id),
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
        id={`create-unit-${organisation.id}`}
        open={open}
        subject="unit"
        title="Create unit"
        onClose={() => setOpen(false)}
        onSubmit={create}
      />
    </>
  );
};

const CreatePersonalUnitAction = ({ capability }: { capability: AdministrationCapability }) => {
  const commands = useAccessCommands();
  const feedback = useAdministrationCommandFeedback();
  const router = useRouter();

  const create = async () => {
    try {
      const { id } = await commands.createPersonalUnit();
      feedback.announce("Personal unit created");
      await router.push(
        administrationLinks.organisationAccessResource("units", assertUnitId(id)) as never,
      );
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

const OrganisationPrivacy = ({
  capability,
  organisation,
}: {
  capability: AdministrationCapability;
  organisation: OrganisationAllDetail;
}) => {
  const commands = useAccessCommands();

  return (
    <Stack spacing={1}>
      <DefaultPrivacySelect
        announcement="Organisation default privacy updated"
        capability={capability}
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
  );
};

const OrganisationResource = ({
  organisation,
  units,
}: {
  organisation: OrganisationAllDetail;
  units: UnitWithOrganisation[];
}) => {
  const commands = useAccessCommands();
  const { caller, defaultOrganisationId, freshness, personalUnitId } = useAccessFacts();
  const isDefaultOrganisation = isDefaultOrganisationResource(
    organisation.id,
    defaultOrganisationId,
  );
  const facts = { caller, freshness, isDefaultOrganisation, organisation };
  const organisationUnits = units.filter((entry) => entry.organisation.id === organisation.id);

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <ResourceChip label={isDefaultOrganisation ? "Default organisation" : "Organisation"} />
      <ResourceIdentity id={organisation.id} name={organisation.name} type="Organisation" />
      {organisation.owner_id ? (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Owner: {organisation.owner_id}
        </Typography>
      ) : null}

      <Section title="Units">
        {organisationUnits.length === 0 ? (
          <Typography color="text.secondary">
            This organisation has no units you can see.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {organisationUnits.map(({ unit }) => (
              <ResourceLink
                href={administrationLinks.organisationAccessResource(
                  "units",
                  assertUnitId(unit.id),
                )}
                id={unit.id}
                key={unit.id}
                name={unit.name}
                type={unitTypeLabel(unit.id, personalUnitId)}
              />
            ))}
          </Stack>
        )}
        <Stack spacing={2} sx={{ alignItems: "flex-start", mt: 2 }}>
          <CreateUnitAction
            capability={evaluateUnitCreationCapability(facts)}
            existingNames={organisationUnits.map(({ unit }) => unit.name)}
            organisation={organisation}
          />
          <CreatePersonalUnitAction
            capability={evaluatePersonalUnitCreationCapability({
              freshness,
              isDefaultOrganisation,
              personalUnit: personalUnitId === undefined ? "absent" : "present",
            })}
          />
        </Stack>
      </Section>

      <Section title="Default project privacy">
        <OrganisationPrivacy
          capability={evaluateOrganisationPrivacyCapability(facts)}
          organisation={organisation}
        />
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

export const AddressedOrganisation = ({ organisationId }: { organisationId: OrganisationId }) => {
  const { units } = useAccessIndex();
  const addressed = useAddressedOrganisation(organisationId);

  return (
    <AddressedResourceView addressed={addressed} identity={({ id }) => id} task={task}>
      {(organisation) => <OrganisationResource organisation={organisation} units={units} />}
    </AddressedResourceView>
  );
};
