import { useState } from "react";

import { useGetProductsSuspense } from "@/api/account-server/product";

import { DeleteForever as DeleteForeverIcon } from "@mui/icons-material";
import { Alert, Box, Button, Link as MuiLink, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/router";
import { z } from "zod/mini";

import { ModalWrapper } from "../components/modals/ModalWrapper";
import { WarningDeleteButton } from "../components/WarningDeleteButton";
import { useGetStorageCost } from "../hooks/useGetStorageCost";
import { useIsEvaluator } from "../hooks/useIsAuthorized";
import { projectLinks } from "../projects/routes";
import { withBasePath } from "../utils/app/basePath";
import { formatCoins } from "../utils/app/coins";
import { toLocalTimeString } from "../utils/app/datetime";
import { useAccessFacts, useAccessIndex, useAddressedProduct } from "./accessFacts";
import { type AdministrationCapability } from "./capabilities";
import { administrationResourceLabel } from "./failures";
import { assertProductId } from "./identifiers";
import {
  AddressedResourceView,
  CapabilityAction,
  EmptyTask,
  PageTitle,
  resourceAncestry,
  ResourceChip,
  ResourceIdentity,
  ResourceLink,
  Section,
} from "./resources";
import { administrationLinks, type AdministrationRoute } from "./routes";
import {
  evaluateDatasetSubscriptionCreationCapability,
  evaluateProjectHandoffCapability,
  evaluateSubscriptionAdjustmentCapability,
  evaluateSubscriptionDeletionCapability,
  type SubscriptionCallerFacts,
} from "./subscriptionCapabilities";
import {
  describeSubscription,
  groupSubscriptionsByOwner,
  type Subscription,
  type SubscriptionFacts,
  subscriptionKindLabel,
  type SubscriptionOrganisationOwner,
  type SubscriptionUnitOwner,
} from "./subscriptionFacts";
import { useAdministrationCommandFeedback } from "./useAdministrationFeedback";
import { useSubscriptionCommands } from "./useSubscriptionCommands";

export type SubscriptionResourceRoute = Extract<AdministrationRoute, { kind: "subscription" }>;

const task = "Subscriptions";

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
 * Creates the one subscription this task owns. A project-tier subscription is created by Project
 * creation, which claims it in the same workflow, so Administration never offers to create one.
 */
const CreateDatasetStorageSubscriptionAction = ({
  capability,
  organisationId,
  unit,
}: {
  capability: AdministrationCapability;
  organisationId: string;
  unit: SubscriptionUnitOwner;
}) => {
  const [open, setOpen] = useState(false);
  const commands = useSubscriptionCommands();
  const feedback = useAdministrationCommandFeedback();
  const form = useForm({
    defaultValues: { allowance: 1000, name: "Dataset Storage" },
    validators: { onChange: storageSubscriptionSchema },
    onSubmit: async ({ value }) => {
      try {
        await commands.createDatasetStorageSubscription({ organisationId, unitId: unit.id }, value);
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

  return (
    <>
      <CapabilityAction capability={capability}>
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

const SubscriptionSummary = ({ subscription }: { subscription: SubscriptionFacts }) => (
  <ResourceLink
    headingLevel="h5"
    href={administrationLinks.subscription(assertProductId(subscription.productId))}
    id={subscription.productId}
    name={subscription.name}
    type={subscriptionKindLabel[subscription.kind]}
  />
);

const UnitSubscriptions = ({
  group,
  organisation,
}: {
  group: { subscriptions: SubscriptionFacts[]; unit: SubscriptionUnitOwner };
  organisation: SubscriptionOrganisationOwner;
}) => {
  const callerFacts = useSubscriptionCallerFacts();
  const facts = callerFacts({ organisation, unit: group.unit });

  return (
    <Box sx={{ mt: 2 }}>
      <Typography component="h4" variant="subtitle1">
        {group.unit.name}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 1, overflowWrap: "anywhere" }} variant="caption">
        {group.unit.id}
      </Typography>
      {group.subscriptions.length === 0 ? (
        <Typography color="text.secondary">This unit holds no subscriptions.</Typography>
      ) : (
        <Stack spacing={2}>
          {group.subscriptions.map((subscription) => (
            <SubscriptionSummary key={subscription.productId} subscription={subscription} />
          ))}
        </Stack>
      )}
      <Box sx={{ mt: 2 }}>
        <CreateDatasetStorageSubscriptionAction
          capability={evaluateDatasetSubscriptionCreationCapability(facts)}
          organisationId={organisation.id}
          unit={group.unit}
        />
      </Box>
    </Box>
  );
};

export const SubscriptionsIndex = () => {
  const { organisations, units } = useAccessIndex();
  const { data } = useGetProductsSuspense();
  const groups = groupSubscriptionsByOwner({ organisations, products: data.products, units });
  const held = groups.some(({ units: unitGroups }) =>
    unitGroups.some(({ subscriptions }) => subscriptions.length > 0),
  );

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <Typography color="text.secondary" sx={{ mb: 2 }}>
        Every subscription is grouped under the organisation and unit that pays for it. Project tier
        subscriptions are claimed by a project; dataset storage subscriptions pay for uploads.
      </Typography>
      {groups.length === 0 ? (
        <EmptyTask>
          No subscriptions are available. Organisation or unit membership is required to hold or
          create one.
        </EmptyTask>
      ) : (
        <>
          {held ? null : (
            <Alert severity="info" sx={{ mb: 2 }}>
              No subscriptions are available yet in the organisations and units you can see.
            </Alert>
          )}
          <Stack divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />} spacing={3}>
            {groups.map(({ organisation, units: unitGroups }) => (
              <Box key={organisation.id}>
                <Typography component="h3" variant="h6">
                  {organisation.name}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ overflowWrap: "anywhere" }}
                  variant="caption"
                >
                  {organisation.id}
                </Typography>
                {unitGroups.length === 0 ? (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    No units of this organisation are visible to you.
                  </Typography>
                ) : (
                  unitGroups.map((group) => (
                    <UnitSubscriptions
                      group={group}
                      key={group.unit.id}
                      organisation={organisation}
                    />
                  ))
                )}
              </Box>
            ))}
          </Stack>
        </>
      )}
    </>
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
          <MuiLink component={Link} href={projectLinks.manage(projectId) as never}>
            Manage this project
          </MuiLink>
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
}: {
  capability: AdministrationCapability;
  subscription: SubscriptionFacts;
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
            await router.replace(administrationLinks.subscriptions() as never);
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
const SubscriptionResourceView = ({ product }: { product: Subscription }) => {
  const subscription = describeSubscription(product);
  const callerFacts = useSubscriptionCallerFacts();
  const facts = callerFacts({ organisation: product.organisation, unit: product.unit });

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <ResourceChip label={subscriptionKindLabel[subscription.kind]} />
      <ResourceIdentity
        ancestry={resourceAncestry(subscription.organisation.name, subscription.unit.name)}
        id={subscription.productId}
        name={subscription.name}
        type="Product"
      />

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
        <Box sx={{ mt: 1 }}>
          <MuiLink
            href={withBasePath(
              administrationLinks.chargeResource(
                "products",
                assertProductId(subscription.productId),
              ),
            )}
          >
            View this subscription&apos;s charges
          </MuiLink>
        </Box>
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
        />
      </Section>
    </>
  );
};

/**
 * The subscription in the address bar answers for itself through its own generated product, so one
 * the caller may read but does not list keeps its identity, and a denial and an absence are told
 * apart by the Administration failure contract rather than by index membership.
 */
export const SubscriptionResource = ({ route }: { route: SubscriptionResourceRoute }) => {
  const addressed = useAddressedProduct(route.productId);

  return (
    <AddressedResourceView
      addressed={addressed}
      identity={(subscription) => subscription.product.id}
      task={task}
    >
      {(product) => <SubscriptionResourceView product={product} />}
    </AddressedResourceView>
  );
};
