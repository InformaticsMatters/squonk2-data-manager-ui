import { type ReactNode } from "react";

import { Alert, Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { administrationLinks } from "../administration/routes";
import { CenterLoader } from "../components/CenterLoader";
import Layout from "../layouts/Layout";
import { isProductId } from "../routing/identifiers";
import { toLocalTimeString } from "../utils/app/datetime";
import {
  evaluateProjectAdministratorsCapability,
  evaluateProjectDeletionCapability,
  evaluateProjectEditorsCapability,
  evaluateProjectExecutionCapability,
  evaluateProjectFileMutationCapability,
  evaluateProjectObserversCapability,
  evaluateProjectPlatformAdministrationCapability,
  evaluateProjectPrivacyCapability,
  type ProjectCapability,
  projectIsReadOnly,
  type ProjectRoles,
} from "./capabilities";
import { type ProjectFacts, useProjectFacts } from "./projectFacts";
import {
  PlatformAdministrationAction,
  ProjectDeletionControl,
  ProjectMembersControl,
  ProjectPrivacyControl,
} from "./ProjectManageActions";
import { type ProjectSubscriptionFacts } from "./projectSubscription";

const atLimitMessage = "This project's subscription is at its coin limit.";

const Section = ({ children, title }: { children: ReactNode; title: string }) => (
  <Box sx={{ mt: 4 }}>
    <Typography gutterBottom component="h2" variant="h6">
      {title}
    </Typography>
    {children}
  </Box>
);

const Fact = ({ label, value }: { label: string; value: ReactNode }) => (
  <Stack
    component="li"
    direction={{ xs: "column", sm: "row" }}
    spacing={{ sm: 1 }}
    sx={{ py: 0.25 }}
  >
    <Typography color="text.secondary" sx={{ minWidth: 200 }}>
      {label}
    </Typography>
    <Typography component="span" sx={{ overflowWrap: "anywhere" }}>
      {value}
    </Typography>
  </Stack>
);

const Facts = ({ children }: { children: ReactNode }) => (
  <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
    {children}
  </Box>
);

/**
 * States what the caller may do with one project action. A hidden capability renders nothing at
 * all, an ordinary unavailable one explains itself, and an available one says so, so a viewer can
 * always tell an action they lack from an action that does not exist for them.
 */
const CapabilityFact = ({
  capability,
  label,
}: {
  capability: ProjectCapability;
  label: string;
}) => {
  if (capability.status === "hidden") {
    return null;
  }
  return <Fact label={label} value={capability.reason ?? "Available to you."} />;
};

const accessLabel = (roles: ProjectRoles) => {
  const held = [
    roles.isAdministrator ? "Administrator" : undefined,
    roles.isCreator ? "Creator" : undefined,
    roles.isEditor ? "Editor" : undefined,
    roles.isObserver ? "Observer" : undefined,
  ].filter(Boolean);
  return held.length > 0 ? held.join(", ") : "No project role";
};

const SubscriptionFacts = ({ subscription }: { subscription: ProjectSubscriptionFacts }) => (
  <>
    {!!subscription.atLimit && (
      <Alert severity="warning" sx={{ mb: 2 }}>
        {atLimitMessage}
      </Alert>
    )}
    <Facts>
      <Fact label="Tier" value={subscription.tier ?? "No tier"} />
      <Fact label="Subscription type" value={subscription.type} />
      <Fact label="Coins used" value={subscription.used} />
      <Fact label="Coin allowance" value={subscription.allowance} />
      <Fact label="Coin limit" value={subscription.limit} />
      <Fact label="Predicted spend" value={subscription.prediction} />
      <Fact label="Current burn rate" value={subscription.burnRate} />
      <Fact label="Billing day" value={subscription.billingDay} />
      <Fact label="Days remaining" value={subscription.remainingDays} />
      <Fact label="Storage size" value={subscription.storageSize} />
      <Fact label="Storage coins used" value={subscription.storageCoinsUsed} />
      {subscription.instanceCoinsUsed === undefined ? null : (
        <Fact label="Instance coins used" value={subscription.instanceCoinsUsed} />
      )}
    </Facts>
  </>
);

const ProjectManageContent = ({ facts }: { facts: ProjectFacts }) => {
  const { organisation, product, project, subscription, unit } = facts;
  const privacy = evaluateProjectPrivacyCapability(facts);
  const administrators = evaluateProjectAdministratorsCapability(facts);
  const editors = evaluateProjectEditorsCapability(facts);
  const observers = evaluateProjectObserversCapability(facts);
  const deletion = evaluateProjectDeletionCapability(facts);
  const files = evaluateProjectFileMutationCapability(facts);
  const execution = evaluateProjectExecutionCapability(facts);
  const platformAdministration = evaluateProjectPlatformAdministrationCapability(facts);
  const subscriptionId = isProductId(product.product.id) ? product.product.id : undefined;

  return (
    <>
      <Typography component="h1" variant="h4">
        Manage
      </Typography>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
        <Typography component="h2" variant="h5">
          {project.name}
        </Typography>
        <Chip label={project.private ? "Private" : "Public"} size="small" variant="outlined" />
      </Stack>
      {!!projectIsReadOnly(facts) && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You have read-only access to this project. Every project change below explains what it
          requires.
        </Alert>
      )}

      <Section title="Project">
        <Facts>
          <Fact label="Your access" value={accessLabel(facts.roles)} />
          <Fact label="Created" value={toLocalTimeString(project.created, true, true)} />
          <Fact label="Creator" value={project.creator} />
          <Fact label="Containing unit" value={unit.name} />
          <Fact label="Owning organisation" value={organisation.name} />
          <Fact label="Privacy" value={project.private ? "Private" : "Public"} />
        </Facts>
        <ProjectPrivacyControl
          capability={privacy}
          isPrivate={project.private}
          projectId={project.project_id}
        />
      </Section>

      {/* Manage is the only owner of these lists. Each control reads the project in the URL and
          answers to its own capability, so no other screen has to decide who may change them. */}
      <Section title="People">
        <Stack spacing={3}>
          <ProjectMembersControl
            capability={administrators}
            members={project.administrators}
            projectId={project.project_id}
            role="administrator"
          />
          <ProjectMembersControl
            capability={editors}
            members={project.editors}
            projectId={project.project_id}
            role="editor"
          />
          <ProjectMembersControl
            capability={observers}
            members={project.observers}
            projectId={project.project_id}
            role="observer"
          />
        </Stack>
      </Section>

      <Section title="Subscription and usage">
        <SubscriptionFacts subscription={subscription} />
      </Section>

      <Section title="Working in this project">
        <Facts>
          <CapabilityFact capability={files} label="Change files" />
          <CapabilityFact capability={execution} label="Run work" />
        </Facts>
      </Section>

      {/* Deleting the project is Manage's own action, and the only one that outlives the project it
          is for: the request is made here and monitored on its own route. */}
      <Section title="Deletion">
        <ProjectDeletionControl
          capability={deletion}
          productId={product.product.id}
          projectId={project.project_id}
          projectName={project.name}
        />
      </Section>

      {/* A non-hidden capability already implies a resolved caller; this only narrows the name the
          command sends, and decides nothing about authority. */}
      {platformAdministration.status === "hidden" || !facts.caller.username ? null : (
        <Section title="Platform administration">
          <PlatformAdministrationAction
            capability={platformAdministration}
            projectId={project.project_id}
            username={facts.caller.username}
          />
        </Section>
      )}

      <Section title="Support">
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Quote these identifiers when you contact a project administrator, an organisation owner,
          or your Squonk administrator.
        </Typography>
        <Facts>
          <Fact label="Project ID" value={project.project_id} />
          <Fact label="Subscription ID" value={product.product.id} />
          <Fact label="Unit ID" value={unit.id} />
          <Fact label="Organisation ID" value={organisation.id} />
        </Facts>
        {subscriptionId ? (
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              component={Link}
              href={administrationLinks.subscription(subscriptionId)}
              variant="outlined"
            >
              View subscription
            </Button>
            <Button
              component={Link}
              href={administrationLinks.chargeResource("products", subscriptionId)}
              variant="outlined"
            >
              View charges
            </Button>
          </Stack>
        ) : null}
      </Section>
    </>
  );
};

/**
 * Project Manage is available to every project viewer. It presents the facts of the project in the
 * URL and what the caller may do with it; it never becomes unavailable merely because the caller
 * cannot change anything.
 */
export const ProjectManage = () => {
  const facts = useProjectFacts();

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        {facts ? <ProjectManageContent facts={facts} /> : <CenterLoader />}
      </Container>
    </Layout>
  );
};
