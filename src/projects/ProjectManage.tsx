import { type ReactNode, useState } from "react";

import { Alert, Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

import { administrationLinks } from "../administration/routes";
import { CenterLoader } from "../components/CenterLoader";
import Layout from "../layouts/Layout";
import { isProductId } from "../routing/identifiers";
import { toLocalTimeString } from "../utils/app/datetime";
import {
  capabilityReason,
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
import { projectMutationFailureMessage } from "./failures";
import { type ProjectFacts, useProjectFacts } from "./projectFacts";
import { type ProjectSubscriptionFacts } from "./projectSubscription";
import { useProjectCommands } from "./useProjectCommands";

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

const userList = (users: string[]) => (users.length > 0 ? users.join(", ") : "None");

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

/**
 * The one exclusively platform-administrator project action. Its rejection is presented in place:
 * the project in the URL, the adopted organisation, and the canonical route are untouched, because
 * the server response is authorization feedback rather than a navigation event.
 */
const PlatformAdministrationAction = ({
  capability,
  projectId,
  username,
}: {
  capability: ProjectCapability;
  projectId: string;
  username: string | undefined;
}) => {
  const commands = useProjectCommands();
  const [feedback, setFeedback] = useState<{ message: string; rejected: boolean } | undefined>();
  const [isPending, setIsPending] = useState(false);

  const take = async () => {
    if (username === undefined) {
      return;
    }
    setIsPending(true);
    setFeedback(undefined);
    try {
      await commands.takeProjectAdministration(projectId, username);
      setFeedback({ message: "You now administer this project.", rejected: false });
    } catch (error) {
      const message = projectMutationFailureMessage(
        error,
        "take administration of",
        `project ${projectId}`,
      );
      setFeedback({
        message: message ?? "Could not take administration of this project.",
        rejected: true,
      });
    }
    setIsPending(false);
  };

  return (
    <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
      <Button
        disabled={capability.status === "disabled" || isPending || username === undefined}
        variant="outlined"
        onClick={() => void take()}
      >
        Take project administration
      </Button>
      {capabilityReason(capability) ? (
        <Typography color="text.secondary" variant="body2">
          {capabilityReason(capability)}
        </Typography>
      ) : null}
      {feedback ? (
        <Alert severity={feedback.rejected ? "warning" : "success"}>{feedback.message}</Alert>
      ) : null}
    </Stack>
  );
};

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
          <CapabilityFact capability={privacy} label="Change privacy" />
        </Facts>
      </Section>

      <Section title="People">
        <Facts>
          <Fact label="Administrators" value={userList(project.administrators)} />
          <CapabilityFact capability={administrators} label="Change administrators" />
          <Fact label="Editors" value={userList(project.editors)} />
          <CapabilityFact capability={editors} label="Change editors" />
          <Fact label="Observers" value={userList(project.observers)} />
          <CapabilityFact capability={observers} label="Change observers" />
        </Facts>
      </Section>

      <Section title="Subscription and usage">
        <SubscriptionFacts subscription={subscription} />
      </Section>

      <Section title="Working in this project">
        <Facts>
          <CapabilityFact capability={files} label="Change files" />
          <CapabilityFact capability={execution} label="Run work" />
          <CapabilityFact capability={deletion} label="Delete this project" />
        </Facts>
      </Section>

      {platformAdministration.status === "hidden" ? null : (
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
