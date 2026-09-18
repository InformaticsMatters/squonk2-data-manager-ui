import { type ReactNode, useEffect } from "react";

import { type OrganisationAllDetail, type UnitAllDetail } from "@/api/account-server";
import { useGetUnits } from "@/api/account-server/unit";

import { Stack, Typography } from "@mui/material";

import { NavigationTab } from "../layouts/navigation/NavigationTab";
import { unitTypeLabel } from "./accessControls";
import { useAccessFacts, useAddressedUnit } from "./accessFacts";
import { UnitChargeLedger } from "./ChargeLedgers";
import { useAdoptOrganisation, useOrganisationInEffect } from "./organisationInEffect";
import { AddressedResourceView, PageTitle, ResourceChip } from "./resources";
import { type AdministrationRoute, unitSectionHref, unitSections } from "./routes";
import { resolveUnitOrganisationScope, type UnitOrganisationScope } from "./scope";
import { SubscriptionSection, UnitSubscriptions } from "./Subscriptions";
import { UnitAccess } from "./UnitAccess";
import { UnitReport } from "./UsageInventory";

/** Every route that renders inside one unit, whichever of its sections is addressed. */
export type UnitRoute = Extract<AdministrationRoute, { unitId: string }>;

/** What this section is called while the unit it is about has not answered yet. */
const section = "Unit";

/**
 * Adopts the organisation a unit URL belongs to, when the caller's own grouped unit index names it.
 *
 * That index is the only source of a unit's parent — the unit resource carries none — and the
 * organisation-scoped units endpoint is never probed across organisations to discover one, because
 * that is owner discovery and it would leak resource existence. A unit whose parent nothing names
 * therefore opens without ancestry and without changing which organisation the caller works as,
 * which is the accepted cost of keeping the organisation out of every URL.
 */
const useUnitOrganisation = (unitId: string): UnitOrganisationScope => {
  const organisationInEffect = useOrganisationInEffect();
  const adoptOrganisation = useAdoptOrganisation();
  const { data: unitGroups } = useGetUnits();
  const scope = resolveUnitOrganisationScope({
    organisationIdInEffect:
      organisationInEffect.kind === "organisation"
        ? organisationInEffect.organisationId
        : undefined,
    unitGroups: unitGroups?.units,
    unitId,
  });
  const adopted = scope.kind === "adopt" ? scope.organisation.id : undefined;

  useEffect(() => {
    if (adopted) {
      adoptOrganisation({ id: adopted });
    }
  }, [adopted, adoptOrganisation]);

  return scope;
};

const UnitSectionContent = ({
  organisation,
  route,
  unit,
}: {
  organisation?: OrganisationAllDetail;
  route: UnitRoute;
  unit: UnitAllDetail;
}) => {
  switch (route.kind) {
    case "unit-access":
      return <UnitAccess organisation={organisation} unit={unit} />;
    case "unit-subscriptions":
      return <UnitSubscriptions organisation={organisation} unit={unit} />;
    case "unit-charges":
      return <UnitChargeLedger organisation={organisation} route={route} unit={unit} />;
    case "unit-usage":
      return <UnitReport organisation={organisation} unit={unit} />;
    default:
      return <SubscriptionSection route={route} />;
  }
};

const UnitIdentity = ({
  children,
  organisation,
  unit,
  unitSection,
}: {
  children: ReactNode;
  organisation?: OrganisationAllDetail;
  unit: UnitAllDetail;
  /** The unit tab that is current; a subscription route keeps Subscriptions marked. */
  unitSection: (typeof unitSections)[number]["key"];
}) => {
  const { personalUnitId } = useAccessFacts();

  return (
    <>
      <PageTitle>{unit.name}</PageTitle>
      <ResourceChip label={unitTypeLabel(unit.id, personalUnitId)} />
      {organisation ? <Typography color="text.secondary">{organisation.name}</Typography> : null}
      <Typography color="text.secondary" sx={{ mb: 2, overflowWrap: "anywhere" }} variant="caption">
        Unit ID {unit.id}
      </Typography>
      <Stack
        aria-label="Unit sections"
        component="nav"
        direction="row"
        sx={{ borderBottom: 1, borderColor: "divider", mb: 3, overflowX: "auto" }}
      >
        {unitSections.map((section) => (
          <NavigationTab
            active={unitSection === section.key}
            href={unitSectionHref(section.key, unit.id)}
            key={section.key}
            label={section.label}
          />
        ))}
      </Stack>
      {children}
    </>
  );
};

/**
 * One unit, and whichever of its four sections the URL names.
 *
 * The unit is read once and its identity and tab strip stay put across every section, so inspecting
 * one unit's access, spend and usage is three tab clicks rather than three list searches.
 */
export const UnitWorkspace = ({ route }: { route: UnitRoute }) => {
  const scope = useUnitOrganisation(route.unitId);
  const addressed = useAddressedUnit(route.unitId);
  const organisation = scope.kind === "unknown" ? undefined : scope.organisation;
  const unitSection =
    route.kind === "subscription" || route.kind === "subscription-charges"
      ? "unit-subscriptions"
      : route.kind;

  return (
    <AddressedResourceView
      addressed={addressed}
      identity={({ id }) => id}
      section={section}
      subject="unit"
    >
      {(unit) => (
        <UnitIdentity organisation={organisation} unit={unit} unitSection={unitSection}>
          <UnitSectionContent organisation={organisation} route={route} unit={unit} />
        </UnitIdentity>
      )}
    </AddressedResourceView>
  );
};
