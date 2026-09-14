import { useState } from "react";

import { type OrganisationAllDetail, type UnitAllDetail } from "@/api/account-server";

import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import { type ColumnDef, createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/router";
import { z } from "zod/mini";

import { DataTable } from "../components/DataTable";
import { ModalWrapper } from "../components/modals/ModalWrapper";
import { WarningDeleteButton } from "../components/WarningDeleteButton";
import { useGetStorageCost } from "../hooks/useGetStorageCost";
import { useIsEvaluator } from "../hooks/useIsAuthorized";
import { NavigationTab } from "../layouts/navigation/NavigationTab";
import { projectLinks } from "../projects/routes";
import { formatCoins } from "../utils/app/coins";
import { toLocalTimeString } from "../utils/app/datetime";
import { useAccessFacts, useAddressedProduct, useAddressedUnitProducts } from "./accessFacts";
import { type AdministrationCapability } from "./capabilities";
import { SubscriptionChargeLedger } from "./ChargeLedgers";
import { administrationResourceLabel } from "./failures";
import {
  AddressedResourceView,
  AdministrationLink,
  CapabilityAction,
  ResourceChip,
  ResourceIdentity,
  Section,
} from "./resources";
import {
  administrationLinks,
  type AdministrationRoute,
  subscriptionSectionHref,
  subscriptionSections,
} from "./routes";
import {
  evaluateDatasetSubscriptionCreationCapability,
  evaluateProjectHandoffCapability,
  evaluateSubscriptionAdjustmentCapability,
  evaluateSubscriptionDeletionCapability,
  type SubscriptionCallerFacts,
} from "./subscriptionCapabilities";
import {
  describeSubscription,
  type Subscription,
  type SubscriptionFacts,
  subscriptionKindLabel,
  type SubscriptionOrganisationOwner,
  type SubscriptionUnitOwner,
} from "./subscriptionFacts";
import { useAdministrationCommandFeedback } from "./useAdministrationFeedback";
import { useSubscriptionCommands } from "./useSubscriptionCommands";

export type SubscriptionRoute = Extract<
  AdministrationRoute,
  { kind: "subscription-charges" | "subscription" }
>;

/** What this section is called while the subscription it is about has not answered yet. */
const section = "Subscription";

/**
 * What the caller is to the unit a subscription belongs to. Personal-unit identity is only claimed
 * once the generated resources behind it have answered, so an evaluation account is never told the
 * wrong thing about its own unit while that is still unknown.
 */
const useSubscriptionCallerFacts = (): ((owner: {
  organisation?: SubscriptionOrganisationOwner;
  unit: SubscriptionUnitOwner;
}) => SubscriptionCallerFacts) => {
  const { caller, freshness, personalUnitId } = useAccessFacts();
  const isEvaluator = useIsEvaluator();

  return ({ organisation, unit }) => ({
    caller,
    freshness,
    isEvaluator,
    isPersonalUnit: freshness === "current" ? personalUnitId === unit.id : undefined,
    organisation,
    unit,
  });
};

const storageSubscriptionSchema = z.object({
  allowance: z
    .number()
    .check(z.minimum(1, "Allowance must be at least 1"), z.int("Allowance must be a whole number")),
  name: z.string().check(z.minLength(1, "A name is required")),
});

const CoinCost = ({ allowance }: { allowance: number }) => {
  const cost = useGetStorageCost();
  return cost === undefined ? null : (
    <Typography color="text.secondary" variant="body2">
      Cost: {formatCoins(cost * allowance)}
    </Typography>
  );
};

/**
 * Creates the one subscription this section owns, inside the unit it will belong to. A project-tier
 * subscription is created by Project creation, which claims it in the same workflow, so
 * Administration never offers to create one.
 */
const CreateDatasetStorageSubscriptionAction = ({
  capability,
  organisation,
  unit,
}: {
  capability: AdministrationCapability;
  /** Absent when the unit's organisation is not among the caller's grouped units. */
  organisation?: SubscriptionOrganisationOwner;
  unit: SubscriptionUnitOwner;
}) => {
  const [open, setOpen] = useState(false);
  const commands = useSubscriptionCommands();
  const feedback = useAdministrationCommandFeedback();
  const form = useForm({
    defaultValues: { allowance: 1000, name: "Dataset Storage" },
    validators: { onChange: storageSubscriptionSchema },
    onSubmit: async ({ value }) => {
      if (!organisation) {
        return;
      }
      try {
        await commands.createDatasetStorageSubscription(
          { organisationId: organisation.id, unitId: unit.id },
          value,
        );
        feedback.announce("Subscription created");
        setOpen(false);
        form.reset();
      } catch (error) {
        // The form keeps everything entered, so the same subscription can be requested again.
        feedback.report(
          error,
          "create a subscription in",
          administrationResourceLabel.unit(unit.id),
        );
      }
    },
  });

  // A unit whose organisation the caller's own index does not name has no owner to bill, and this
  // client will not discover one: the action states that rather than sending a request with no
  // organisation behind it.
  const owned: AdministrationCapability = organisation
    ? capability
    : {
        status: "disabled",
        reason:
          "This unit's organisation is not readable, so a subscription cannot be billed here.",
      };

  return (
    <>
      <CapabilityAction capability={owned}>
        {({ disabled }) => (
          <Button
            aria-label={`Create dataset storage subscription in ${unit.name}`}
            disabled={disabled}
            variant="outlined"
            onClick={() => setOpen(true)}
          >
            Create dataset storage subscription
          </Button>
        )}
      </CapabilityAction>
      <ModalWrapper
        DialogProps={{ fullWidth: true, maxWidth: "sm" }}
        id={`create-subscription-${unit.id}`}
        open={open}
        submitDisabled={!form.state.canSubmit}
        submitText="Create"
        title={`Create dataset storage subscription in ${unit.name}`}
        onClose={() => setOpen(false)}
        onSubmit={() => void form.handleSubmit()}
      >
        <Stack spacing={2} sx={{ my: 2 }}>
          <form.Field name="name">
            {(field) => (
              <TextField
                autoFocus
                fullWidth
                error={field.state.meta.errors.length > 0}
                helperText={field.state.meta.errors.map((error) => error?.message)[0]}
                label="Subscription name"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
              />
            )}
          </form.Field>
          <form.Field name="allowance">
            {(field) => (
              <TextField
                error={field.state.meta.errors.length > 0}
                helperText={field.state.meta.errors.map((error) => error?.message)[0]}
                label="Allowance"
                slotProps={{ htmlInput: { min: 1 } }}
                type="number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(Number(event.target.value))}
              />
            )}
          </form.Field>
          <CoinCost allowance={form.state.values.allowance} />
        </Stack>
      </ModalWrapper>
    </>
  );
};

/** One row of a unit's subscription list, as the unit's own product read reports it. */
type SubscriptionRow = SubscriptionFacts & { href: string };

const rowHelper = createColumnHelper<SubscriptionRow>();
const subscriptionColumns = [
  rowHelper.accessor("name", {
    header: "Subscription",
    cell: ({ row }) => (
      <AdministrationLink href={row.original.href}>{row.original.name}</AdministrationLink>
    ),
  }),
  rowHelper.accessor((row) => subscriptionKindLabel[row.kind], { header: "Kind", id: "kind" }),
  rowHelper.accessor((row) => row.claim?.name ?? row.claim?.serviceId ?? "—", {
    header: "Claim",
    id: "claim",
  }),
  rowHelper.accessor((row) => `${row.used} of ${row.allowance}`, {
    header: "Coins used",
    id: "coins",
  }),
  rowHelper.accessor((row) => toLocalTimeString(row.created, true, true), {
    header: "Created",
    id: "created",
  }),
] as ColumnDef<SubscriptionRow>[];

/**
 * A unit's own subscriptions, read from the unit-scoped product endpoint rather than by filtering a
 * global collection, and created here because this is the unit they will belong to — so nobody
 * chooses an owner twice.
 */
export const UnitSubscriptions = ({
  organisation,
  unit,
}: {
  /** Absent when the addressed unit is readable but is not among the caller's grouped units. */
  organisation?: OrganisationAllDetail;
  unit: UnitAllDetail;
}) => {
  const addressed = useAddressedUnitProducts(unit.id);
  const callerFacts = useSubscriptionCallerFacts();
  const facts = callerFacts({ organisation, unit });

  return (
    <Stack spacing={2}>
      <Box>
        <CreateDatasetStorageSubscriptionAction
          capability={evaluateDatasetSubscriptionCreationCapability(facts)}
          // A subscription is bought in the unit's own organisation, which the Account Server needs
          // to bill it. An organisation the caller's grouped index does not name is absent here
          // rather than stood in for, so nothing offers to create a subscription with no owner.
          organisation={organisation}
          unit={unit}
        />
      </Box>
      <AddressedResourceView
        addressed={addressed}
        identity={() => unit.id}
        section="Subscriptions"
        subject="unit"
      >
        {(products) => {
          const rows = (products.products as Subscription[]).map<SubscriptionRow>((product) => {
            const subscription = describeSubscription(product);
            return {
              ...subscription,
              href: administrationLinks.subscription(unit.id, subscription.productId),
            };
          });
          return rows.length === 0 ? (
            <Alert severity="info">This unit holds no subscriptions.</Alert>
          ) : (
            <DataTable
              columns={subscriptionColumns}
              data={rows}
              searchLabel="Search subscriptions"
            />
          );
        }}
      </AddressedResourceView>
    </Stack>
  );
};

const Fact = ({ children, label }: { children: string; label: string }) => (
  <Typography>
    {label}: {children}
  </Typography>
);

/**
 * What a project-tier subscription is being used for. A claim this route family can address becomes
 * a link into the project that owns it; one it cannot stays readable as the identity the Account
 * Server reported, because Administration never guesses what a service identity refers to.
 */
const ClaimInformation = ({
  capability,
  subscription,
}: {
  /** Whether this caller could hand the subscription to Project creation, and why not if not. */
  capability: AdministrationCapability;
  subscription: SubscriptionFacts;
}) => {
  if (subscription.claim) {
    const { name, projectId, serviceId } = subscription.claim;
    return (
      <Stack spacing={1}>
        <Typography>
          This subscription is claimed by {name ?? "a project"} ({serviceId}).
        </Typography>
        {projectId ? (
          <AdministrationLink href={projectLinks.manage(projectId)}>
            Manage this project
          </AdministrationLink>
        ) : (
          <Typography color="text.secondary" variant="body2">
            The claim names a resource this application cannot open.
          </Typography>
        )}
      </Stack>
    );
  }

  return (
    <Stack spacing={1}>
      <Typography>No project is using this subscription yet.</Typography>
      <CapabilityAction capability={capability}>
        {({ disabled }) =>
          disabled ? (
            <Button disabled variant="contained">
              Create linked project
            </Button>
          ) : (
            <Button
              component={Link}
              href={projectLinks.create({ subscriptionId: subscription.productId })}
              variant="contained"
            >
              Create linked project
            </Button>
          )
        }
      </CapabilityAction>
    </Stack>
  );
};

/**
 * The Account Server refuses to reduce an allowance, so the form refuses the same value rather than
 * sending a request whose only possible answer is a rejection. The floor is the subscription's own
 * current allowance, which is why the schema is built from it rather than stated once.
 */
const adjustmentSchema = (allowance: number) =>
  z.object({
    allowance: z
      .number()
      .check(
        z.minimum(allowance, "An allowance cannot be reduced"),
        z.int("Allowance must be a whole number"),
      ),
    name: z.string().check(z.minLength(1, "A name is required")),
  });

/**
 * Adjusts what the Account Server lets a subscription change. An allowance belongs to the
 * subscription whose allowance the caller chose, so a project tier says its tier decides instead of
 * offering a value the endpoint would reject.
 */
const AdjustSubscription = ({
  capability,
  subscription,
}: {
  capability: AdministrationCapability;
  subscription: SubscriptionFacts;
}) => {
  const commands = useSubscriptionCommands();
  const feedback = useAdministrationCommandFeedback();
  const adjustsAllowance = subscription.kind === "dataset-storage";
  const disabled = capability.status !== "enabled";
  const form = useForm({
    defaultValues: { allowance: subscription.allowance, name: subscription.name },
    validators: { onChange: adjustmentSchema(subscription.allowance) },
    onSubmit: async ({ value }) => {
      try {
        await commands.adjustSubscription(
          {
            organisationId: subscription.organisation.id,
            productId: subscription.productId,
            unitId: subscription.unit.id,
          },
          adjustsAllowance
            ? { allowance: value.allowance, limit: value.allowance, name: value.name }
            : { name: value.name },
        );
        feedback.announce("Subscription adjusted");
      } catch (error) {
        feedback.report(
          error,
          "adjust",
          administrationResourceLabel.subscription(subscription.productId),
        );
      }
    },
  });

  return (
    <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
      <form.Field name="name">
        {(field) => (
          <TextField
            disabled={disabled}
            error={field.state.meta.errors.length > 0}
            helperText={field.state.meta.errors.map((error) => error?.message)[0]}
            label="Subscription name"
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
          />
        )}
      </form.Field>
      {adjustsAllowance ? (
        <form.Field name="allowance">
          {(field) => (
            <TextField
              disabled={disabled}
              error={field.state.meta.errors.length > 0}
              helperText={
                field.state.meta.errors.map((error) => error?.message)[0] ??
                "An allowance can be increased but never reduced."
              }
              label="Allowance"
              slotProps={{ htmlInput: { min: subscription.allowance } }}
              type="number"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(Number(event.target.value))}
            />
          )}
        </form.Field>
      ) : (
        <Typography color="text.secondary" variant="body2">
          A project tier subscription takes its allowance and limit from its tier.
        </Typography>
      )}
      {adjustsAllowance ? <CoinCost allowance={form.state.values.allowance} /> : null}
      <CapabilityAction capability={capability}>
        {() => (
          <Button
            disabled={disabled || !form.state.canSubmit || form.state.isSubmitting}
            variant="outlined"
            onClick={() => void form.handleSubmit()}
          >
            Adjust subscription
          </Button>
        )}
      </CapabilityAction>
    </Stack>
  );
};

const DeleteSubscriptionAction = ({
  capability,
  subscription,
  unitId,
}: {
  capability: AdministrationCapability;
  subscription: SubscriptionFacts;
  /** The unit in the address bar, which is where a removed subscription's list lives. */
  unitId: string;
}) => {
  const commands = useSubscriptionCommands();
  const feedback = useAdministrationCommandFeedback();
  const router = useRouter();

  return (
    <CapabilityAction capability={capability}>
      {({ disabled }) => (
        <WarningDeleteButton
          retainOnError
          modalId={`delete-subscription-${subscription.productId}`}
          title="Delete subscription"
          tooltipText="Delete this subscription"
          onDelete={async () => {
            try {
              await commands.deleteSubscription({
                organisationId: subscription.organisation.id,
                productId: subscription.productId,
                unitId: subscription.unit.id,
              });
            } catch (error) {
              feedback.report(
                error,
                "delete",
                administrationResourceLabel.subscription(subscription.productId),
              );
              throw error;
            }
            feedback.announce("Subscription deleted");
            await router.replace(administrationLinks.unitSubscriptions(unitId) as never);
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
              Delete subscription
            </Button>
          )}
        </WarningDeleteButton>
      )}
    </CapabilityAction>
  );
};

/**
 * The addressed subscription's own product resource carries the organisation and unit it belongs
 * to, so every capability here is decided by the membership facts that subscription itself declares
 * rather than by whether the caller's index happens to list its owners.
 */
const SubscriptionDetail = ({
  product,
  subscription,
  unitId,
}: {
  product: Subscription;
  subscription: SubscriptionFacts;
  unitId: string;
}) => {
  const callerFacts = useSubscriptionCallerFacts();
  const facts = callerFacts({ organisation: product.organisation, unit: product.unit });

  return (
    <>
      <Section title="Subscription">
        <Fact label="Product type">{subscription.type}</Fact>
        {subscription.tier ? <Fact label="Tier">{subscription.tier}</Fact> : null}
        <Fact label="Created">{toLocalTimeString(subscription.created, true, true)}</Fact>
        <Fact label="Billing day">{String(subscription.billingDay)}</Fact>
        <Fact label="Allowance">{`${subscription.used} of ${subscription.allowance} coins used`}</Fact>
        <Fact label="Limit">{String(subscription.limit)}</Fact>
        <Fact label="Storage">{subscription.storageSize}</Fact>
        {subscription.atLimit ? (
          <Alert severity="warning" sx={{ mt: 1 }}>
            This subscription is at its coin limit.
          </Alert>
        ) : null}
      </Section>

      {subscription.claimable || subscription.claim ? (
        <Section title="Project">
          <ClaimInformation
            capability={evaluateProjectHandoffCapability({ ...facts, product })}
            subscription={subscription}
          />
        </Section>
      ) : null}

      <Section title="Adjustment">
        <AdjustSubscription
          capability={evaluateSubscriptionAdjustmentCapability({
            ...facts,
            kind: subscription.kind,
          })}
          subscription={subscription}
        />
      </Section>

      <Section title="Deletion">
        <DeleteSubscriptionAction
          capability={evaluateSubscriptionDeletionCapability({
            ...facts,
            claimed: subscription.claim !== undefined,
          })}
          subscription={subscription}
          unitId={unitId}
        />
      </Section>
    </>
  );
};

/**
 * One subscription inside the unit that pays for it: its own identity, its two sections, and the
 * ledger one of them addresses. It renders directly rather than canonicalising, because the URL
 * already names both the unit and the product.
 */
export const SubscriptionSection = ({ route }: { route: SubscriptionRoute }) => {
  const addressed = useAddressedProduct(route.productId);

  return (
    <AddressedResourceView
      addressed={addressed}
      identity={(subscription) => subscription.product.id}
      section={section}
      subject="subscription"
    >
      {(product) => {
        const subscription = describeSubscription(product);
        return (
          <>
            <ResourceChip label={subscriptionKindLabel[subscription.kind]} />
            <ResourceIdentity id={subscription.productId} name={subscription.name} type="Product" />
            <Stack
              aria-label="Subscription sections"
              component="nav"
              direction="row"
              sx={{ borderBottom: 1, borderColor: "divider", mb: 3, mt: 2, overflowX: "auto" }}
            >
              {subscriptionSections.map((section) => (
                <NavigationTab
                  active={route.kind === section.key}
                  href={subscriptionSectionHref(section.key, route.unitId, route.productId)}
                  key={section.key}
                  label={section.label}
                />
              ))}
            </Stack>
            {route.kind === "subscription" ? (
              <SubscriptionDetail
                product={product}
                subscription={subscription}
                unitId={route.unitId}
              />
            ) : (
              <SubscriptionChargeLedger route={route} subscription={subscription} />
            )}
          </>
        );
      }}
    </AddressedResourceView>
  );
};
