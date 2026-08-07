import { useEffect, useRef, useState } from "react";

import {
  ProductDetailFlavour,
  type UnitAllDetailDefaultProductPrivacy,
  type UnitProductPostBodyBodyFlavour,
} from "@/api/account-server";
import { useGetProduct, useGetProductTypes } from "@/api/account-server/product";
import { useGetUnitsSuspense } from "@/api/account-server/unit";

import {
  Alert,
  Button,
  Container,
  FormControlLabel,
  Link as MuiLink,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/router";

import { administrationLinks } from "../administration/routes";
import { useFamilyRoute } from "../application/FamilyRouteBoundary";
import Layout from "../layouts/Layout";
import {
  eligibleProjectCreationUnits,
  forgetProjectCreation,
  initialProjectCreationState,
  productCreationFailureIsRetryable,
  type ProjectCreationEffect,
  projectCreationFailureReason,
  type ProjectCreationInput,
  projectCreationNameIsValid,
  type ProjectCreationRecovery,
  type ProjectCreationState,
  type ProjectCreationTransition,
  readProjectCreationRecovery,
  rememberProjectCreation,
  transitionProjectCreation,
  validateProjectSubscriptionHandoff,
} from "./projectCreation";
import { projectLinks } from "./routes";
import { useProjectCreationCommands } from "./useProjectCreationCommands";

const projectSubscriptionType = "DATA_MANAGER_PROJECT_TIER_SUBSCRIPTION";
const privateByDefault: Record<UnitAllDetailDefaultProductPrivacy, boolean> = {
  ALWAYS_PRIVATE: true,
  ALWAYS_PUBLIC: false,
  DEFAULT_PRIVATE: true,
  DEFAULT_PUBLIC: false,
};

const tierLabel = (flavour: string) => flavour.charAt(0) + flavour.slice(1).toLocaleLowerCase();

export const ProjectCreate = () => {
  const router = useRouter();
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;
  if (route?.kind !== "create") {
    throw new Error("Project creation requires the canonical creation route");
  }
  const { data: unitGroups } = useGetUnitsSuspense();
  const eligibleUnits = eligibleProjectCreationUnits(unitGroups.units);
  const { data: productTypes, error: productTypesError } = useGetProductTypes();
  const handoff = useGetProduct(route.subscriptionId ?? "", {
    query: { enabled: route.subscriptionId !== undefined, retry: false },
  });
  const commands = useProjectCreationCommands();
  const [lifecycle, setLifecycle] = useState<ProjectCreationState>(initialProjectCreationState);
  const [name, setName] = useState("");
  const [unitId, setUnitId] = useState("");
  const [flavour, setFlavour] = useState<UnitProductPostBodyBodyFlavour | "">("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [recovery, setRecovery] = useState<ProjectCreationRecovery>();
  const initializedSubscription = useRef<string | undefined>(undefined);
  const recoveryNavigation = useRef(false);
  const [recoveringRoute, setRecoveringRoute] = useState(false);

  const handoffValidation = handoff.data
    ? validateProjectSubscriptionHandoff(handoff.data.product, eligibleUnits)
    : undefined;
  const validHandoff =
    handoffValidation?.kind === "valid" ? handoffValidation.subscription : undefined;
  const flavours = (productTypes?.product_types ?? [])
    .filter(({ type }) => type === projectSubscriptionType)
    .flatMap(({ flavour }) => (flavour ? [flavour as UnitProductPostBodyBodyFlavour] : []));
  const selectedUnit = eligibleUnits.find(({ unit }) => unit.id === unitId)?.unit;
  const pending =
    recoveringRoute ||
    lifecycle.kind === "creating-product" ||
    lifecycle.kind === "creating-project" ||
    lifecycle.kind === "cleaning-up";

  useEffect(() => {
    if (route.subscriptionId !== undefined) {
      recoveryNavigation.current = false;
      setRecoveringRoute(false);
      return;
    }
    const stored = readProjectCreationRecovery(sessionStorage);
    if (stored && !recoveryNavigation.current) {
      recoveryNavigation.current = true;
      setRecoveringRoute(true);
      const href = projectLinks.create({ subscriptionId: stored.productId });
      void router.replace(href as never).then(
        (replaced) => {
          if (!replaced) {
            globalThis.location.assign(href);
          }
        },
        () => globalThis.location.assign(href),
      );
    }
  }, [route.subscriptionId, router]);

  useEffect(() => {
    if (!validHandoff || initializedSubscription.current === validHandoff.product.id) {
      return;
    }
    initializedSubscription.current = validHandoff.product.id;
    const stored = readProjectCreationRecovery(sessionStorage);
    if (
      stored?.productId === validHandoff.product.id &&
      stored.input.unitId === validHandoff.unit.id &&
      stored.input.flavour === validHandoff.product.flavour
    ) {
      setRecovery(stored);
      setName(stored.input.name);
      setUnitId(stored.input.unitId);
      setFlavour(stored.input.flavour);
      setIsPrivate(stored.input.isPrivate);
      setLifecycle({
        input: stored.input,
        kind: "project-failed",
        origin: "created",
        productId: stored.productId,
        reason: "This project was not completed. Retry it or cancel and clean up its subscription.",
      });
      return;
    }
    if (stored?.productId === validHandoff.product.id) {
      forgetProjectCreation(sessionStorage);
    }
    setName(validHandoff.product.name ?? "");
    setUnitId(validHandoff.unit.id);
    setFlavour(validHandoff.product.flavour ?? "");
    setIsPrivate(privateByDefault[validHandoff.unit.default_product_privacy]);
  }, [validHandoff]);

  const runEffect = async (effect: ProjectCreationEffect, state: ProjectCreationState) => {
    if (effect.kind === "create-product") {
      let productId: string;
      try {
        productId = await commands.createProduct(effect.input);
      } catch (error) {
        setLifecycle(
          transitionProjectCreation(state, {
            kind: "product-failed",
            reason: projectCreationFailureReason(error, "subscription"),
            retryable: productCreationFailureIsRetryable(error),
          }).state,
        );
        return;
      }
      const next = transitionProjectCreation(state, { kind: "product-created", productId });
      const remembered = rememberProjectCreation(sessionStorage, {
        input: effect.input,
        productId,
      });
      if (remembered) {
        setRecovery({ input: effect.input, productId });
      }
      setLifecycle(next.state);
      initializedSubscription.current = productId;
      try {
        const replaced = await router.replace(
          projectLinks.create({ subscriptionId: productId }) as never,
          undefined,
          { shallow: true },
        );
        if (!replaced) {
          throw new Error("Project creation recovery navigation was cancelled");
        }
      } catch {
        setLifecycle(
          transitionProjectCreation(next.state, {
            kind: "project-failed",
            reason:
              "The recovery address could not be recorded. Retry without reloading this page.",
          }).state,
        );
        return;
      }
      if (next.effect) {
        await runEffect(next.effect, next.state);
      }
      return;
    }
    if (effect.kind === "create-project") {
      let projectId: string;
      try {
        projectId = await commands.createProject(effect.input, effect.productId);
      } catch (error) {
        setLifecycle(
          transitionProjectCreation(state, {
            kind: "project-failed",
            reason: projectCreationFailureReason(error, "project"),
          }).state,
        );
        return;
      }
      const completed = transitionProjectCreation(state, { kind: "project-created", projectId });
      setLifecycle(completed.state);
      forgetProjectCreation(sessionStorage);
      setRecovery(undefined);
      void router.push(projectLinks.files(projectId) as never);
      return;
    }
    try {
      await commands.deleteProduct(effect.productId);
    } catch (error) {
      setLifecycle(
        transitionProjectCreation(state, {
          kind: "cleanup-failed",
          reason: projectCreationFailureReason(error, "subscription"),
        }).state,
      );
      return;
    }
    forgetProjectCreation(sessionStorage);
    setRecovery(undefined);
    setLifecycle(transitionProjectCreation(state, { kind: "cleanup-succeeded" }).state);
    void router.push(projectLinks.index() as never);
  };

  const applyTransition = async (transition: ProjectCreationTransition) => {
    setLifecycle(transition.state);
    if (transition.effect) {
      await runEffect(transition.effect, transition.state);
    }
  };

  const submit = async () => {
    if (!flavour || !projectCreationNameIsValid(name) || !unitId) {
      return;
    }
    const input: ProjectCreationInput = { flavour, isPrivate, name, unitId };
    await applyTransition(
      transitionProjectCreation(initialProjectCreationState, {
        input,
        kind: "submit",
        ...(validHandoff && route.subscriptionId
          ? {
              subscription: {
                origin:
                  recovery?.productId === route.subscriptionId
                    ? ("created" as const)
                    : ("handoff" as const),
                productId: route.subscriptionId,
              },
            }
          : {}),
      }),
    );
  };

  const selectUnit = (nextUnitId: string) => {
    setUnitId(nextUnitId);
    const unit = eligibleUnits.find(({ unit }) => unit.id === nextUnitId)?.unit;
    if (unit) {
      setIsPrivate(privateByDefault[unit.default_product_privacy]);
    }
  };

  const retry = () => void applyTransition(transitionProjectCreation(lifecycle, { kind: "retry" }));
  const cancel = () => {
    if (lifecycle.kind === "project-failed") {
      void applyTransition(transitionProjectCreation(lifecycle, { kind: "cancel" }));
      return;
    }
    void router.push(projectLinks.index() as never);
  };

  const invalidHandoff =
    route.subscriptionId && !handoff.isPending
      ? handoff.error
        ? "This subscription could not be read. Return to Subscriptions or retry this page."
        : handoffValidation?.kind === "invalid"
          ? handoffValidation.reason
          : undefined
      : undefined;
  const failure =
    lifecycle.kind === "product-failed" || lifecycle.kind === "project-failed"
      ? lifecycle.reason
      : undefined;

  return (
    <Layout>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Stack spacing={3}>
          <div>
            <Typography component="h1" variant="h3">
              Create project
            </Typography>
            <Typography color="text.secondary">
              Choose who owns the subscription before creating its linked project.
            </Typography>
          </div>

          {invalidHandoff ? (
            <Alert severity="error">
              {invalidHandoff}{" "}
              <MuiLink component={Link} href={administrationLinks.subscriptions() as never}>
                Open Subscriptions
              </MuiLink>
            </Alert>
          ) : null}
          {pending ? <Alert severity="info">Project creation is in progress.</Alert> : null}
          {failure ? <Alert severity="error">{failure}</Alert> : null}
          {lifecycle.kind === "product-failed" && !lifecycle.retryable ? (
            <Alert severity="warning">
              The request may have reached the Account Server, so it will not be sent again
              automatically. Check{" "}
              <MuiLink component={Link} href={administrationLinks.subscriptions() as never}>
                Subscriptions
              </MuiLink>{" "}
              before starting again.
            </Alert>
          ) : null}
          {lifecycle.kind === "project-failed" ? (
            <Alert severity="warning">
              Subscription {lifecycle.productId} is ready and will be reused. Retrying cannot create
              another subscription.
            </Alert>
          ) : null}
          {lifecycle.kind === "cleanup-failed" ? (
            <Alert severity="error">
              {lifecycle.reason} Subscription ID: {lifecycle.productId}.{" "}
              <MuiLink
                component={Link}
                href={administrationLinks.subscription(lifecycle.productId as never) as never}
              >
                Open it in Administration
              </MuiLink>{" "}
              or quote this ID to support.
            </Alert>
          ) : null}
          {lifecycle.kind === "completed" ? (
            <Alert severity="success">
              Project creation completed.{" "}
              <MuiLink component={Link} href={projectLinks.files(lifecycle.projectId) as never}>
                Open Files
              </MuiLink>
            </Alert>
          ) : null}

          <TextField
            select
            disabled={pending || !!validHandoff}
            helperText={
              eligibleUnits.length === 0
                ? "You must belong to a unit or its organisation before creating a project."
                : "The selected unit owns the project subscription."
            }
            label="Containing unit"
            value={unitId}
            onChange={(event) => selectUnit(event.target.value)}
          >
            {eligibleUnits.map(({ organisationName, unit }) => (
              <MenuItem key={unit.id} value={unit.id}>
                {organisationName} / {unit.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            disabled={pending}
            error={name.length > 0 && !projectCreationNameIsValid(name)}
            helperText="2-80 letters, numbers, spaces, periods, underscores, or hyphens."
            label="Project name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <TextField
            select
            disabled={pending || !!validHandoff}
            error={!!productTypesError}
            helperText={
              productTypesError ? "Project tiers could not be loaded. Reload to retry." : undefined
            }
            label="Tier"
            value={flavour}
            onChange={(event) => {
              const next = event.target.value as UnitProductPostBodyBodyFlavour;
              setFlavour(next);
              if (next === ProductDetailFlavour.EVALUATION) {
                setIsPrivate(false);
              } else if (selectedUnit) {
                setIsPrivate(privateByDefault[selectedUnit.default_product_privacy]);
              }
            }}
          >
            {flavours.map((tier) => (
              <MenuItem
                disabled={
                  tier === ProductDetailFlavour.EVALUATION &&
                  selectedUnit?.default_product_privacy === "ALWAYS_PRIVATE"
                }
                key={tier}
                value={tier}
              >
                {tierLabel(tier)}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={
              <Switch
                checked={isPrivate}
                disabled={
                  pending ||
                  flavour === ProductDetailFlavour.EVALUATION ||
                  selectedUnit?.default_product_privacy === "ALWAYS_PRIVATE" ||
                  selectedUnit?.default_product_privacy === "ALWAYS_PUBLIC"
                }
                onChange={(_, checked) => setIsPrivate(checked)}
              />
            }
            label="Private project"
          />
          <Stack direction="row" spacing={2}>
            {(lifecycle.kind === "product-failed" && lifecycle.retryable) ||
            lifecycle.kind === "project-failed" ? (
              <Button variant="contained" onClick={retry}>
                Retry
              </Button>
            ) : lifecycle.kind === "collecting" ? (
              <Button
                disabled={
                  pending ||
                  !!invalidHandoff ||
                  !flavour ||
                  !projectCreationNameIsValid(name) ||
                  !unitId
                }
                variant="contained"
                onClick={() => void submit()}
              >
                {pending
                  ? "Creating..."
                  : validHandoff
                    ? "Create linked project"
                    : "Create project"}
              </Button>
            ) : null}
            <Button disabled={pending} onClick={cancel}>
              Cancel
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Layout>
  );
};
