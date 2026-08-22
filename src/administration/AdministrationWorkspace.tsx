import { Alert } from "@mui/material";

import { useFamilyRoute } from "../application/FamilyRouteResolution";
import { CenterLoader } from "../components/CenterLoader";
import { useAccessFacts } from "./accessFacts";
import { AdministrationFrame } from "./AdministrationShell";
import { DefaultOrganisationCharges, OrganisationChargeLedger } from "./ChargeLedgers";
import { useOrganisationInEffect } from "./organisationInEffect";
import { OrganisationOverview } from "./OrganisationOverview";
import { PageTitle } from "./resources";
import { type AdministrationRoute } from "./routes";
import { organisationChargesAreOffered } from "./scope";
import { SubscriptionEntry } from "./SubscriptionEntry";
import { UnitWorkspace } from "./UnitWorkspace";
import { OrganisationReport } from "./UsageInventory";

/** The organisation charge ledger, or why the default organisation has none. */
const OrganisationCharges = ({
  organisationId,
  route,
}: {
  organisationId: string;
  route: Extract<AdministrationRoute, { kind: "organisation-charges" }>;
}) => {
  const { defaultOrganisationId } = useAccessFacts();

  return organisationChargesAreOffered(organisationId, defaultOrganisationId) ? (
    <OrganisationChargeLedger organisationId={organisationId} route={route} />
  ) : (
    <DefaultOrganisationCharges />
  );
};

/**
 * The section the URL names, inside the organisation the masthead names. Every organisation-level
 * section is rendered for the organisation in effect; every unit and subscription section is
 * rendered for the resource its own URL identifies.
 */
const AdministrationContent = () => {
  const context = useFamilyRoute();
  const organisation = useOrganisationInEffect();
  if (context.policy.kind !== "administration") {
    throw new Error("Administration workspace requires an Administration route");
  }
  if (context.localNotFound) {
    return (
      <>
        <PageTitle>Not found</PageTitle>
        <Alert severity="warning">The requested Administration resource was not found.</Alert>
      </>
    );
  }

  const route = context.route as AdministrationRoute;
  // A unit and a subscription identify themselves, so they render whichever organisation is in
  // effect; the organisation's own sections have nothing to render until one is.
  if (route.kind === "subscription-entry") {
    return <SubscriptionEntry productId={route.productId} />;
  }
  if (
    route.kind !== "overview" &&
    route.kind !== "organisation-charges" &&
    route.kind !== "organisation-usage"
  ) {
    return <UnitWorkspace route={route} />;
  }
  // Only the organisation-relative sections need one, and each says so for itself rather than the
  // frame withholding the whole workspace.
  if (organisation.kind === "pending") {
    return <CenterLoader />;
  }
  if (organisation.kind === "none") {
    return (
      <Alert severity="info">
        No organisation is selected. Choose an organisation in the masthead to administer it.
      </Alert>
    );
  }
  switch (route.kind) {
    case "overview":
      return (
        <OrganisationOverview
          organisationId={organisation.organisationId}
          organisationName={organisation.name}
        />
      );
    case "organisation-charges":
      return <OrganisationCharges organisationId={organisation.organisationId} route={route} />;
    case "organisation-usage":
      return <OrganisationReport organisationId={organisation.organisationId} />;
  }
};

export const AdministrationWorkspace = () => (
  <AdministrationFrame>
    <AdministrationContent />
  </AdministrationFrame>
);
