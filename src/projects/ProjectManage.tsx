import { type ReactNode } from "react";

import { type UnitAllDetail } from "@/api/account-server";
import { getGetProductQueryKey } from "@/api/account-server/product";

import {
  ContentCopy,
  FolderOutlined,
  LockOutlined,
  PublicOutlined,
  Storage,
  TrendingUp,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { administrationLinks } from "../administration/routes";
import { CenterLoader } from "../components/CenterLoader";
import { isProductId, isUnitId } from "../routing/identifiers";
import { toLocalTimeString } from "../utils/app/datetime";
import {
  capabilityReason,
  evaluateProjectAdministratorsCapability,
  evaluateProjectDeletionCapability,
  evaluateProjectEditorsCapability,
  evaluateProjectExecutionCapability,
  evaluateProjectFileMutationCapability,
  evaluateProjectObserversCapability,
  evaluateProjectPrivacyCapability,
  type ProjectCapability,
  projectIsReadOnly,
  type ProjectRoles,
} from "./capabilities";
import { projectContainerLabel, resolvedAncestry } from "./projectAncestry";
import { type ProjectFacts, useProjectFacts } from "./projectFacts";
import {
  ProjectDeletionControl,
  ProjectMembersControl,
  ProjectPrivacyControl,
} from "./ProjectManageActions";
import { type ProjectSubscriptionFacts } from "./projectSubscription";

const atLimitMessage = "This project's subscription is at its coin limit.";
const coinFormatter = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 20 });

const formatCoins = (value: number) => coinFormatter.format(value);

/** Meter positions are presentation only; the exact values remain visible as text. */
const percentOf = (value: number, limit: number) =>
  limit > 0 ? Math.max(0, Math.min(100, (value / limit) * 100)) : 0;

const heldRoles = (roles: ProjectRoles) =>
  [
    roles.isAdministrator ? "Administrator" : undefined,
    roles.isCreator ? "Creator" : undefined,
    roles.isEditor ? "Editor" : undefined,
    roles.isObserver ? "Observer" : undefined,
  ].filter((role): role is string => role !== undefined);

const Fact = ({ label, value }: { label: string; value: ReactNode }) => (
  <Stack
    component="li"
    direction={{ xs: "column", sm: "row" }}
    spacing={{ sm: 1 }}
    sx={{ py: 0.25 }}
  >
    <Typography color="text.secondary" sx={{ minWidth: { sm: 120 } }} variant="body2">
      {label}
    </Typography>
    <Typography component="span" sx={{ overflowWrap: "anywhere" }} variant="body2">
      {value}
    </Typography>
  </Stack>
);

const Facts = ({ children }: { children: ReactNode }) => (
  <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
    {children}
  </Box>
);

const UsageTile = ({
  caption,
  icon,
  label,
  value,
}: {
  caption?: string;
  icon?: ReactNode;
  label: string;
  value: ReactNode;
}) => (
  <Paper sx={{ height: "100%", p: 2 }} variant="outlined">
    <Stack direction="row" spacing={1} sx={{ alignItems: "center", color: "text.secondary" }}>
      {icon}
      <Typography component="h3" variant="overline">
        {label}
      </Typography>
    </Stack>
    <Typography component="p" sx={{ fontWeight: 600, lineHeight: 1.2 }} variant="h5">
      {value}
    </Typography>
    {caption ? (
      <Typography color="text.secondary" variant="caption">
        {caption}
      </Typography>
    ) : null}
  </Paper>
);

const CapabilitySummary = ({
  capability,
  label,
}: {
  capability: ProjectCapability;
  label: string;
}) => {
  if (capability.status === "hidden") {
    return null;
  }
  const available = capability.status === "enabled";
  return (
    <Stack component="li" direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
      <Chip
        color={available ? "success" : "default"}
        label={available ? "Available" : "Unavailable"}
        size="small"
      />
      <Box>
        <Typography variant="body2">{label}</Typography>
        {capabilityReason(capability) ? (
          <Typography color="text.secondary" variant="caption">
            {capabilityReason(capability)}
          </Typography>
        ) : null}
      </Box>
    </Stack>
  );
};

const Identifier = ({ label, value }: { label: string; value: string }) => (
  <Stack
    component="li"
    direction="row"
    spacing={1}
    sx={{ alignItems: "center", minWidth: 0, py: 0.25 }}
  >
    <Typography color="text.secondary" sx={{ minWidth: { sm: 92 } }} variant="body2">
      {label}
    </Typography>
    <Typography
      component="code"
      sx={{ flex: 1, fontFamily: "monospace", minWidth: 0, overflowWrap: "anywhere" }}
      variant="body2"
    >
      {value}
    </Typography>
    <Tooltip title={`Copy ${label.toLowerCase()} identifier`}>
      <IconButton
        aria-label={`Copy ${label.toLowerCase()} identifier`}
        size="small"
        onClick={() => void navigator.clipboard.writeText(value).catch(() => undefined)}
      >
        <ContentCopy fontSize="inherit" />
      </IconButton>
    </Tooltip>
  </Stack>
);

/**
 * The project's linked subscription, as the coin usage it has and the unit it is administered in.
 * It is only rendered for a subscription that could be read; nothing here is inferred from the
 * project, because coins, limits and tier are facts of the product alone.
 */
const SubscriptionCard = ({
  subscription,
  unit,
}: {
  subscription: ProjectSubscriptionFacts;
  unit: UnitAllDetail;
}) => {
  // Manage already holds the containing unit, so both links address the subscription where it
  // actually lives rather than at a bare record with no surrounding context.
  const subscriptionId =
    isProductId(subscription.productId) && isUnitId(unit.id) ? subscription.productId : undefined;
  const usedPercent = percentOf(subscription.used, subscription.limit);
  const allowancePercent = percentOf(subscription.allowance, subscription.limit);

  return (
    <Card aria-labelledby="coin-usage-heading" component="section" variant="outlined">
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { sm: "baseline" }, mb: 1 }}
        >
          <Typography component="h2" id="coin-usage-heading" variant="h6">
            Coin usage
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            <Chip
              label={subscription.tier ?? "No tier"}
              size="small"
              sx={{ textTransform: "capitalize" }}
            />
            <Chip label={subscription.type} size="small" variant="outlined" />
          </Stack>
        </Stack>

        {subscription.atLimit ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {atLimitMessage}
          </Alert>
        ) : null}

        <Typography component="p" sx={{ fontWeight: 700 }} variant="h3">
          {formatCoins(subscription.used)}
          <Typography color="text.secondary" component="span" variant="h6">
            {` / ${formatCoins(subscription.limit)} coins`}
          </Typography>
        </Typography>
        <Box sx={{ mt: 1, position: "relative" }}>
          <LinearProgress
            aria-label="Coin usage"
            aria-valuetext={`${formatCoins(subscription.used)} of ${formatCoins(subscription.limit)} coins used`}
            color={subscription.atLimit ? "error" : usedPercent > 80 ? "warning" : "primary"}
            sx={{ borderRadius: 1, height: 12 }}
            value={usedPercent}
            variant="determinate"
          />
          <Tooltip title={`Included allowance: ${formatCoins(subscription.allowance)} coins`}>
            <Box
              aria-hidden="true"
              sx={{
                bgcolor: "text.primary",
                bottom: -4,
                left: `${allowancePercent}%`,
                position: "absolute",
                top: -4,
                transform: "translateX(-1px)",
                width: 2,
              }}
            />
          </Tooltip>
        </Box>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
          Included allowance: {formatCoins(subscription.allowance)} coins. Billing day{" "}
          {subscription.billingDay}; {subscription.remainingDays} days remaining.
        </Typography>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <UsageTile
              caption="coins per day"
              icon={<TrendingUp fontSize="small" />}
              label="Burn rate"
              value={formatCoins(subscription.burnRate)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <UsageTile
              caption="coins this billing period"
              label="Predicted spend"
              value={formatCoins(subscription.prediction)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <UsageTile
              caption={`${formatCoins(subscription.storageCoinsUsed)} coins`}
              icon={<Storage fontSize="small" />}
              label="Storage"
              value={subscription.storageSize}
            />
          </Grid>
          {subscription.instanceCoinsUsed === undefined ? null : (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <UsageTile
                caption="coins"
                label="Instance spend"
                value={formatCoins(subscription.instanceCoinsUsed)}
              />
            </Grid>
          )}
        </Grid>

        {subscriptionId ? (
          <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1, mt: 2 }}>
            <Button
              component={Link}
              href={administrationLinks.subscription(unit.id, subscriptionId)}
              size="small"
              variant="outlined"
            >
              View subscription
            </Button>
            <Button
              component={Link}
              href={administrationLinks.subscriptionCharges(unit.id, subscriptionId)}
              size="small"
              variant="outlined"
            >
              View charges
            </Button>
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
};

/**
 * What Manage says in place of the subscription it could not read. The Account Server refuses a
 * product to every caller outside its unit, so this is the ordinary view of a public project a
 * non-member opened; a read that merely failed is offered again instead, because that one is worth
 * retrying. Either way the project itself is fully usable, and every action that needed the
 * subscription states the same thing where it is offered.
 */
const UnavailableSubscriptionCard = ({
  kind,
  onRetry,
}: {
  kind: "unavailable" | "unreadable";
  onRetry: () => void;
}) => (
  <Card aria-labelledby="subscription-unavailable-heading" component="section" variant="outlined">
    <CardContent>
      <Typography gutterBottom component="h2" id="subscription-unavailable-heading" variant="h6">
        Coin usage
      </Typography>
      <Alert
        action={
          kind === "unreadable" ? (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          ) : undefined
        }
        severity={kind === "unreadable" ? "error" : "info"}
      >
        {kind === "unreadable"
          ? "This project's subscription could not be read, so its coin usage is not shown."
          : "This project's subscription is not available to you, so its coin usage is not shown. Everything else about the project is unaffected."}
      </Alert>
    </CardContent>
  </Card>
);

const ProjectManageContent = ({ facts }: { facts: ProjectFacts }) => {
  const { ancestry, project, subscription } = facts;
  const queryClient = useQueryClient();
  // Names come from the ancestry where it was read; where it was not, the project's own record
  // still identifies its containers, and quoting an identifier beats leaving a blank.
  const resolved = resolvedAncestry(ancestry);
  const unitLabel = projectContainerLabel(resolved?.unit.name, project.unit_id, "Unit");
  const organisationLabel = projectContainerLabel(
    resolved?.organisation.name,
    project.organisation_id,
    "Organisation",
  );
  const productId = resolved?.product.product.id ?? project.product_id;
  const retrySubscription = () => {
    if (project.product_id) {
      void queryClient.refetchQueries({ queryKey: getGetProductQueryKey(project.product_id) });
    }
  };
  const capabilities = {
    administrators: evaluateProjectAdministratorsCapability(facts),
    deletion: evaluateProjectDeletionCapability(facts),
    editors: evaluateProjectEditorsCapability(facts),
    execution: evaluateProjectExecutionCapability(facts),
    files: evaluateProjectFileMutationCapability(facts),
    observers: evaluateProjectObserversCapability(facts),
    privacy: evaluateProjectPrivacyCapability(facts),
  };
  const roles = heldRoles(facts.roles);

  return (
    <Box>
      {/* Manage titles itself exactly as Files, Run and Results do, so a caller who arrives here
          is told which section they are in rather than having to infer it from the project. */}
      <Typography gutterBottom component="h1" variant="h4">
        Manage
      </Typography>
      <Typography color="text.secondary" variant="body2">
        {organisationLabel} › {unitLabel}
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" }, mb: 3, mt: 0.5 }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
          <FolderOutlined color="action" />
          <Typography
            component="h2"
            sx={{ fontWeight: 600, minWidth: 0, overflowWrap: "anywhere" }}
            variant="h5"
          >
            {project.name}
          </Typography>
        </Stack>
        <Stack
          aria-label="Your project roles"
          direction="row"
          spacing={1}
          sx={{ flexWrap: "wrap", gap: 1 }}
        >
          <Chip
            color={project.private ? "default" : "info"}
            icon={project.private ? <LockOutlined /> : <PublicOutlined />}
            label={project.private ? "Private" : "Public"}
            size="small"
          />
          {roles.length > 0 ? (
            roles.map((role) => <Chip color="primary" key={role} label={role} size="small" />)
          ) : (
            <Chip label="No project role" size="small" variant="outlined" />
          )}
        </Stack>
      </Stack>

      {projectIsReadOnly(facts) ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          You have read-only access to this project. Every unavailable project change below explains
          what it requires.
        </Alert>
      ) : null}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          {subscription && resolved ? (
            <SubscriptionCard subscription={subscription} unit={resolved.unit} />
          ) : (
            <UnavailableSubscriptionCard
              kind={ancestry.kind === "unreadable" ? "unreadable" : "unavailable"}
              onRetry={retrySubscription}
            />
          )}

          <Card
            aria-labelledby="project-people-heading"
            component="section"
            sx={{ mt: 3 }}
            variant="outlined"
          >
            <CardContent>
              <Typography gutterBottom component="h2" id="project-people-heading" variant="h6">
                People
              </Typography>
              <Stack divider={<Divider flexItem />} spacing={3}>
                <ProjectMembersControl
                  capability={capabilities.administrators}
                  members={project.administrators}
                  projectId={project.project_id}
                  role="administrator"
                />
                <ProjectMembersControl
                  capability={capabilities.editors}
                  members={project.editors}
                  projectId={project.project_id}
                  role="editor"
                />
                <ProjectMembersControl
                  capability={capabilities.observers}
                  members={project.observers}
                  projectId={project.project_id}
                  role="observer"
                />
              </Stack>
            </CardContent>
          </Card>

          <Card
            aria-labelledby="project-danger-heading"
            component="section"
            sx={{ borderColor: "error.main", mt: 3 }}
            variant="outlined"
          >
            <CardContent>
              <Typography
                gutterBottom
                color="error"
                component="h2"
                id="project-danger-heading"
                variant="h6"
              >
                Danger zone
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
                Deleting this project permanently removes its files and working directories.
              </Typography>
              <ProjectDeletionControl
                capability={capabilities.deletion}
                productId={productId}
                projectId={project.project_id}
                projectName={project.name}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card aria-labelledby="project-about-heading" component="section" variant="outlined">
            <CardContent>
              <Typography gutterBottom component="h2" id="project-about-heading" variant="h6">
                About
              </Typography>
              <Facts>
                <Fact label="Created" value={toLocalTimeString(project.created, true, true)} />
                <Fact label="Creator" value={project.creator} />
                <Fact label="Containing unit" value={unitLabel} />
                <Fact label="Owning organisation" value={organisationLabel} />
                <Fact label="Privacy" value={project.private ? "Private" : "Public"} />
              </Facts>
              <Divider sx={{ my: 2 }} />
              <ProjectPrivacyControl
                capability={capabilities.privacy}
                isPrivate={project.private}
                projectId={project.project_id}
              />
            </CardContent>
          </Card>

          <Card
            aria-labelledby="project-capabilities-heading"
            component="section"
            sx={{ mt: 3 }}
            variant="outlined"
          >
            <CardContent>
              <Typography
                gutterBottom
                component="h2"
                id="project-capabilities-heading"
                variant="h6"
              >
                What you can do here
              </Typography>
              <Stack component="ul" spacing={1.5} sx={{ listStyle: "none", m: 0, p: 0 }}>
                <CapabilitySummary capability={capabilities.files} label="Change files" />
                <CapabilitySummary capability={capabilities.execution} label="Run work" />
              </Stack>
            </CardContent>
          </Card>

          <Card
            aria-labelledby="project-identifiers-heading"
            component="section"
            sx={{ mt: 3 }}
            variant="outlined"
          >
            <CardContent>
              <Typography gutterBottom component="h2" id="project-identifiers-heading" variant="h6">
                Identifiers
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                Quote these identifiers when you contact support.
              </Typography>
              <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
                <Identifier label="Project ID" value={project.project_id} />
                {/* Identifiers are quoted to support, so each is offered wherever it is known —
                    the project carries its own containers, whether or not they could be read. */}
                {productId ? <Identifier label="Subscription ID" value={productId} /> : null}
                {project.unit_id ? <Identifier label="Unit ID" value={project.unit_id} /> : null}
                {project.organisation_id ? (
                  <Identifier label="Organisation ID" value={project.organisation_id} />
                ) : null}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
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
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {facts ? <ProjectManageContent facts={facts} /> : <CenterLoader />}
    </Container>
  );
};
