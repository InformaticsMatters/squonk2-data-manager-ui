import { useState } from "react";

import { type OrganisationAllDetail, type UnitAllDetail } from "@/api/account-server";

import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/router";

import { WarningDeleteButton } from "../components/WarningDeleteButton";
import { type UnitId } from "../routing/identifiers";
import { DefaultPrivacySelect, ManageResourceUsers, task, unitTypeLabel } from "./accessControls";
import { useAccessFacts, useAddressedUnit, useUnitAncestry } from "./accessFacts";
import {
  type AdministrationCapability,
  capabilityReason,
  evaluateUnitDeletionCapability,
  evaluateUnitEditCapability,
  evaluateUnitMembershipCapability,
  evaluateUnitPrivacyCapability,
  isDefaultOrganisationResource,
  isPersonalUnitResource,
} from "./capabilities";
import { administrationResourceLabel } from "./failures";
import {
  effectiveProductPrivacyExplanation,
  inheritedProductPrivacyExplanation,
  type ProductPrivacy,
} from "./privacy";
import {
  AddressedResourceView,
  CapabilityAction,
  PageTitle,
  ResourceChip,
  ResourceIdentity,
  Section,
} from "./resources";
import { administrationLinks } from "./routes";
import { useAccessCommands } from "./useAccessCommands";
import { useAdministrationCommandFeedback } from "./useAdministrationFeedback";

const UnitName = ({
  capability,
  unit,
}: {
  capability: AdministrationCapability;
  unit: UnitAllDetail;
}) => {
  const commands = useAccessCommands();
  const feedback = useAdministrationCommandFeedback();
  const [name, setName] = useState(unit.name);
  const [isPending, setIsPending] = useState(false);
  const disabled = capability.status !== "enabled";

  const rename = async () => {
    setIsPending(true);
    try {
      await commands.updateUnit(unit.id, { name });
      feedback.announce("Unit renamed");
    } catch (error) {
      feedback.report(error, "rename", administrationResourceLabel.unit(unit.id));
    }
    setIsPending(false);
  };

  return (
    <Box sx={{ alignItems: "baseline", display: "flex", gap: 1 }}>
      <TextField
        disabled={disabled}
        helperText={capabilityReason(capability)}
        label="Unit name"
        sx={{ flexGrow: 1 }}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Button
        disabled={disabled || isPending || name === unit.name || name.length < 2}
        onClick={() => void rename()}
      >
        Update
      </Button>
    </Box>
  );
};

/**
 * The unit's own default, the organisation value it inherits, and the privacy new projects actually
 * take. Every one of the three is read from the addressed resource and its current ancestry.
 */
const UnitPrivacy = ({
  capability,
  organisationPrivacy,
  unit,
}: {
  capability: AdministrationCapability;
  /** Absent when the addressed unit's organisation is not among the caller's grouped units. */
  organisationPrivacy?: ProductPrivacy;
  unit: UnitAllDetail;
}) => {
  const commands = useAccessCommands();

  return (
    <Stack spacing={1}>
      <Typography color="text.secondary" variant="body2">
        {inheritedProductPrivacyExplanation(organisationPrivacy)}
      </Typography>
      <DefaultPrivacySelect
        announcement="Unit default privacy updated"
        capability={capability}
        privacy={unit.default_product_privacy}
        resource={administrationResourceLabel.unit(unit.id)}
        update={(privacy) => commands.updateUnit(unit.id, { default_product_privacy: privacy })}
      />
      <Typography color="text.secondary" variant="body2">
        {effectiveProductPrivacyExplanation(unit.default_product_privacy)}
      </Typography>
    </Stack>
  );
};

const DeleteUnitAction = ({
  capability,
  isPersonalUnit,
  unit,
}: {
  capability: AdministrationCapability;
  isPersonalUnit: boolean;
  unit: UnitAllDetail;
}) => {
  const commands = useAccessCommands();
  const feedback = useAdministrationCommandFeedback();
  const router = useRouter();

  return (
    <CapabilityAction capability={capability}>
      {({ disabled }) => (
        <WarningDeleteButton
          retainOnError
          modalId={`delete-unit-${unit.id}`}
          title="Delete unit"
          tooltipText="Delete this unit"
          onDelete={async () => {
            try {
              await commands.deleteUnit(unit.id, isPersonalUnit);
            } catch (error) {
              feedback.report(error, "delete", administrationResourceLabel.unit(unit.id));
              throw error;
            }
            feedback.announce("Unit deleted");
            await router.replace(administrationLinks.organisationAccess() as never);
          }}
        >
          {({ openModal }) => (
            <Button
              color="error"
              disabled={disabled}
              startIcon={<DeleteForeverIcon />}
              variant="outlined"
              onClick={() => openModal()}
            >
              Delete unit
            </Button>
          )}
        </WarningDeleteButton>
      )}
    </CapabilityAction>
  );
};

const UnitResource = ({
  organisation,
  unit,
}: {
  /** Absent when the addressed unit is readable but is not among the caller's grouped units. */
  organisation?: OrganisationAllDetail;
  unit: UnitAllDetail;
}) => {
  const commands = useAccessCommands();
  const { caller, defaultOrganisationId, freshness, personalUnitId } = useAccessFacts();
  const isPersonalUnit = isPersonalUnitResource(unit.id, personalUnitId);
  const facts = {
    caller,
    freshness,
    isDefaultOrganisation:
      organisation !== undefined &&
      isDefaultOrganisationResource(organisation.id, defaultOrganisationId),
    isPersonalUnit,
    organisation,
    unit,
  };
  const editCapability = evaluateUnitEditCapability(facts);
  const organisationPrivacy = organisation?.default_product_privacy;

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <ResourceChip label={unitTypeLabel(unit.id, personalUnitId)} />
      <ResourceIdentity ancestry={organisation?.name} id={unit.id} name={unit.name} type="Unit" />
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Owner: {unit.owner_id}
      </Typography>

      <Section title="Name">
        <UnitName capability={editCapability} unit={unit} />
      </Section>

      <Section title="Default project privacy">
        <UnitPrivacy
          capability={evaluateUnitPrivacyCapability({ ...facts, organisationPrivacy })}
          organisationPrivacy={organisationPrivacy}
          unit={unit}
        />
      </Section>

      <Section title="Members">
        <ManageResourceUsers
          add={(userId) => commands.addUnitMember(unit.id, userId)}
          capability={evaluateUnitMembershipCapability(facts)}
          disabledUsers={[unit.owner_id]}
          noun="Member"
          remove={(userId) => commands.removeUnitMember(unit.id, userId)}
          resource={administrationResourceLabel.unit(unit.id)}
          title="Unit members"
          users={unit.users.map((user) => user.id)}
        />
      </Section>

      <Section title="Deletion">
        <DeleteUnitAction
          capability={evaluateUnitDeletionCapability(facts)}
          isPersonalUnit={isPersonalUnit}
          unit={unit}
        />
      </Section>
    </>
  );
};

export const AddressedUnit = ({ unitId }: { unitId: UnitId }) => {
  const organisation = useUnitAncestry(unitId);
  const addressed = useAddressedUnit(unitId);

  return (
    <AddressedResourceView addressed={addressed} identity={({ id }) => id} task={task}>
      {(unit) => <UnitResource organisation={organisation} unit={unit} />}
    </AddressedResourceView>
  );
};
