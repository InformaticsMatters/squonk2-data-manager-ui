import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";

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
import { useFamilyRoute } from "../application/FamilyRouteResolution";
import { useGetPersonalUnit } from "../hooks/useGetPersonalUnit";
import { useIsEvaluator } from "../hooks/useIsAuthorized";
import { isProductId } from "../routing/identifiers";
import { projectCreationFailureReason } from "./failures";
import {
  eligibleProjectCreationFlavours,
  eligibleProjectCreationUnits,
  forgetProjectCreation,
  initialProjectCreationState,
  productCreationFailureIsRetryable,
  type ProjectCreationEffect,
  type ProjectCreationInput,
  projectCreationNameIsValid,
  type ProjectCreationRecovery,
  type ProjectCreationState,
  type ProjectCreationTransition,
  readProjectCreationRecovery,
  reconcileProjectCreationRecovery,
  rememberProjectCreation,
  transitionProjectCreation,
  validateProjectSubscriptionHandoff,
} from "./projectCreation";
import { projectLinks } from "./routes";
import { useProjectCreationCommands } from "./useProjectCreationCommands";

const privateByDefault: Record<UnitAllDetailDefaultProductPrivacy, boolean> = {
  ALWAYS_PRIVATE: true,
  ALWAYS_PUBLIC: false,
  DEFAULT_PRIVATE: true,
  DEFAULT_PUBLIC: false,
};

const tierLabel = (flavour: string) => flavour.charAt(0) + flavour.slice(1).toLocaleLowerCase();

/**
 * How a subscription this attempt did not remove is left reachable. The ID is the recovery, so an
 * unaddressable one still reaches support as itself rather than throwing inside the route builder
 * that would have addressed it.
 */
const SubscriptionRecovery = ({ productId }: { productId: string }) => (
  <>
    Subscription ID: {productId}.{" "}
    {isProductId(productId) ? (
      <>
        <MuiLink component={Link} href={administrationLinks.subscription(productId) as never}>
          Open it in Administration
        </MuiLink>{" "}
        or quote this ID to support.
      </>
    ) : (
      "Quote this ID to support."
    )}
  </>
);

export const ProjectCreate = () => {
  const router = useRouter();
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;
  if (route?.kind !== "create") {
    throw new Error("Project creation requires the canonical creation route");
  }
  const { data: unitGroups } = useGetUnitsSuspense();
  const isEvaluator = useIsEvaluator();
  const { data: personalUnit } = useGetPersonalUnit();
  const eligibleUnits = eligibleProjectCreationUnits(unitGroups.units, {
    evaluatorPersonalUnitId: personalUnit?.id,
    isEvaluator,
  });
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
  const [reconciling, setReconciling] = useState(false);
  const initializedSubscription = useRef<string | undefined>(undefined);
  const initializedRecovery = useRef(false);
  const recoveryNavigation = useRef(false);
  const [recoveringRoute, setRecoveringRoute] = useState(false);

  const handoffValidation = handoff.data
    ? validateProjectSubscriptionHandoff(handoff.data.product, eligibleUnits)
    : undefined;
  const validHandoff =
    handoffValidation?.kind === "valid" ? handoffValidation.subscription : undefined;
  const flavours = eligibleProjectCreationFlavours(productTypes?.product_types ?? [], isEvaluator);
  const selectedUnit = eligibleUnits.find(({ unit }) => unit.id === unitId)?.unit;
  const pending =
    recoveringRoute ||
    reconciling ||
    lifecycle.kind === "creating-product" ||
    lifecycle.kind === "creating-project" ||
    lifecycle.kind === "cleaning-up";
  const hydrateRecovery = useEffectEvent((stored: ProjectCreationRecovery) => {
    setRecovery(stored);
    setName(stored.input.name);
    setUnitId(stored.input.unitId);
    setFlavour(stored.input.flavour);
    setIsPrivate(stored.input.isPrivate);
  });

  // The record and the React state are one fact in two places, so every write goes through these.
  const storeRecovery = (nextRecovery: ProjectCreationRecovery) => {
    rememberProjectCreation(sessionStorage, nextRecovery);
    setRecovery(nextRecovery);
  };

  const clearRecovery = useCallback(() => {
    forgetProjectCreation(sessionStorage);
    setRecovery(undefined);
  }, []);

  /**
   * Entering Files replaces this attempt, so it must not be left behind for a later visit. Both the
   * reconciling effect and a deliberate retry settle a committed project this way, so it is stable
   * enough for an effect to depend on rather than restate.
   */
  const completeRecoveredProject = useCallback(
    (productId: string, projectId: string) => {
      clearRecovery();
      setLifecycle({ kind: "completed", productId, projectId });
      void router.replace(projectLinks.files(projectId) as never);
    },
    [clearRecovery, router],
  );

  /** Where an attempt that is not entering Files leaves the caller, however it ended. */
  const leaveForProjects = () => void router.push(projectLinks.index() as never);

  /**
   * What a bare creation route makes of a record left by an interrupted attempt.
   *
   * A subscription this workflow already requested a project for is put back in the URL before
   * anything else happens, so the attempt is addressed by the same route a handoff arrives on and
   * the Account Server — not this record — settles what became of it. Everything else is rehydrated
   * in place. A record that only reached `product-requested` describes a request whose outcome the
   * browser never saw, so it becomes an unretryable failure rather than a resumable one: replaying
   * it could buy a second subscription for the one the caller already may have.
   */
  useEffect(() => {
    if (route.subscriptionId !== undefined) {
      recoveryNavigation.current = false;
      setRecoveringRoute(false);
      return;
    }
    const stored = readProjectCreationRecovery(sessionStorage);
    if (stored?.kind === "project-requested" && !recoveryNavigation.current) {
      recoveryNavigation.current = true;
      setRecoveringRoute(true);
      const href = projectLinks.create({ subscriptionId: stored.productId });
      void router.replace(href as never).then(
        (replaced) => {
          if (!replaced) {
            globalThis.location.assign(href);
          }
        },
        // A cancelled or rejected client navigation would strand the attempt on a route that cannot
        // reconcile it, so a full page load addresses the subscription instead.
        () => globalThis.location.assign(href),
      );
      return;
    }
    if (stored && !initializedRecovery.current) {
      initializedRecovery.current = true;
      hydrateRecovery(stored);
      setLifecycle(
        stored.kind === "product-failed"
          ? {
              input: stored.input,
              kind: "product-failed",
              reason: stored.reason,
              retryable: stored.retryable,
            }
          : {
              input: stored.input,
              kind: "product-failed",
              reason:
                "The subscription request was interrupted and its outcome could not be confirmed.",
              retryable: false,
            },
      );
    }
  }, [route.subscriptionId, router]);

  /**
   * What the addressed subscription says about the attempt that was left against it.
   *
   * The Account Server's own claim is the authority: a claimed subscription means the project
   * request committed even though its response was lost, so the attempt completes into Files rather
   * than sending a second one. An unclaimed subscription is offered for retry or cancellation, and a
   * subscription no record claims prefills a fresh handoff. The ref keeps one answer per addressed
   * subscription, so a re-render cannot reconcile the same fact twice.
   */
  useEffect(() => {
    const addressedProduct = handoff.data?.product;
    if (!addressedProduct || initializedSubscription.current === addressedProduct.product.id) {
      return;
    }
    initializedSubscription.current = addressedProduct.product.id;
    const stored = readProjectCreationRecovery(sessionStorage);
    if (stored?.kind === "project-requested" && stored.productId === addressedProduct.product.id) {
      const reconciliation = reconcileProjectCreationRecovery(stored, addressedProduct);
      if (reconciliation.kind === "completed") {
        completeRecoveredProject(stored.productId, reconciliation.projectId);
        return;
      }
      if (reconciliation.kind === "resume") {
        hydrateRecovery(stored);
        setLifecycle({
          input: stored.input,
          kind: "project-failed",
          origin: stored.origin,
          productId: stored.productId,
          reason:
            "This project was not completed. Retry it or cancel and clean up its subscription.",
        });
        return;
      }
    }
    if (!validHandoff) {
      return;
    }
    setName(validHandoff.product.name ?? "");
    setUnitId(validHandoff.unit.id);
    setFlavour(validHandoff.product.flavour ?? "");
    setIsPrivate(privateByDefault[validHandoff.unit.default_product_privacy]);
  }, [completeRecoveredProject, handoff.data?.product, router, validHandoff]);

  /**
   * Sends what the lifecycle decided, and records each request before it is sent.
   *
   * Every write to the recovery record happens ahead of the request it describes, because a request
   * whose response never arrives is exactly the one whose record has to already exist. The lifecycle
   * decides what may follow; nothing here chooses to send a second request on its own.
   */
  const runEffect = async (effect: ProjectCreationEffect, state: ProjectCreationState) => {
    if (effect.kind === "create-product") {
      const requestedRecovery: ProjectCreationRecovery = {
        input: effect.input,
        kind: "product-requested",
      };
      storeRecovery(requestedRecovery);
      let productId: string;
      try {
        productId = await commands.createProduct(effect.input);
      } catch (error) {
        const reason = projectCreationFailureReason(error, "subscription");
        const retryable = productCreationFailureIsRetryable(error);
        const failedRecovery: ProjectCreationRecovery = {
          input: effect.input,
          kind: "product-failed",
          reason,
          retryable,
        };
        storeRecovery(failedRecovery);
        setLifecycle(
          transitionProjectCreation(state, { kind: "product-failed", reason, retryable }).state,
        );
        return;
      }
      const next = transitionProjectCreation(state, { kind: "product-created", productId });
      const projectRecovery: ProjectCreationRecovery = {
        input: effect.input,
        kind: "project-requested",
        origin: "created",
        productId,
      };
      storeRecovery(projectRecovery);
      setLifecycle(next.state);
      // This attempt has already reconciled the subscription it just created, so the effect that
      // watches the addressed subscription must not treat the shallow navigation as a fresh handoff.
      initializedSubscription.current = productId;
      // The subscription enters the URL before the project request is sent, so a reload that lands
      // mid-request addresses it and can be settled against the Account Server's own claim.
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
      if (state.kind === "creating-project") {
        const projectRecovery: ProjectCreationRecovery = {
          input: effect.input,
          kind: "project-requested",
          origin: state.origin,
          productId: effect.productId,
        };
        storeRecovery(projectRecovery);
      }
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
      clearRecovery();
      void router.push(projectLinks.files(projectId) as never);
      return;
    }
    try {
      await commands.deleteProduct(effect.productId);
    } catch (error) {
      // The attempt is over either way. A record still naming a project request would send every
      // later visit back to a subscription this workflow can no longer finish, so it goes and the
      // identity it carried is stated on screen beside the route that still owns the subscription.
      clearRecovery();
      setLifecycle(
        transitionProjectCreation(state, {
          kind: "cleanup-failed",
          reason: projectCreationFailureReason(error, "subscription"),
        }).state,
      );
      return;
    }
    clearRecovery();
    setLifecycle(transitionProjectCreation(state, { kind: "cleanup-succeeded" }).state);
    leaveForProjects();
  };

  const applyTransition = async (transition: ProjectCreationTransition) => {
    setLifecycle(transition.state);
    if (transition.effect) {
      await runEffect(transition.effect, transition.state);
    }
  };

  /**
   * An addressed subscription is reused rather than bought again, and it is a handoff only when this
   * workflow has no record of creating it — which is what decides whether cancelling may delete it.
   */
  const submit = async () => {
    if (!flavour || !projectCreationNameIsValid(name) || !unitId) {
      return;
    }
    const input: ProjectCreationInput = { flavour, isPrivate, name, unitId };
    await applyTransition(
      transitionProjectCreation(lifecycle, {
        input,
        kind: "submit",
        ...(validHandoff && route.subscriptionId
          ? {
              subscription: {
                origin:
                  recovery?.kind === "project-requested" &&
                  recovery.productId === route.subscriptionId
                    ? recovery.origin
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

  /**
   * A project retry re-reads its subscription before it sends anything, because the request it is
   * retrying may already have committed: a claimed subscription completes into Files instead, so a
   * lost response cannot become a second project.
   */
  const retry = async () => {
    if (
      lifecycle.kind === "project-failed" &&
      recovery?.kind === "project-requested" &&
      route.subscriptionId
    ) {
      setReconciling(true);
      try {
        const refreshed = await handoff.refetch();
        if (!refreshed.data) {
          setLifecycle({
            ...lifecycle,
            reason: "The subscription could not be verified. Retry after the service recovers.",
          });
          return;
        }
        const reconciliation = reconcileProjectCreationRecovery(recovery, refreshed.data.product);
        if (reconciliation.kind === "completed") {
          completeRecoveredProject(recovery.productId, reconciliation.projectId);
          return;
        }
        if (reconciliation.kind !== "resume") {
          setLifecycle({
            ...lifecycle,
            reason:
              "The subscription is no longer available for this project. Open it in Administration.",
          });
          return;
        }
      } finally {
        setReconciling(false);
      }
    }
    await applyTransition(transitionProjectCreation(lifecycle, { kind: "retry" }));
  };
  const cancel = () => {
    const cancelled = transitionProjectCreation(lifecycle, { kind: "cancel" });
    // Only a created subscription is this workflow's to remove, so only that cancellation carries an
    // effect; it owns its own record and navigation because both must survive until the server has
    // answered the deletion.
    if (cancelled.effect) {
      void applyTransition(cancelled);
      return;
    }
    setLifecycle(cancelled.state);
    // A cancellation leaves a later visit nothing to recover, whether it settled the subscription or
    // released one it never owned. A released one still exists, so the page stays put and states
    // where it can be reached; leaving is then the caller's own next step.
    if (cancelled.state.kind === "cancelled" || cancelled.state.kind === "released") {
      clearRecovery();
    }
    if (cancelled.state.kind === "released") {
      return;
    }
    leaveForProjects();
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
            {lifecycle.reason} <SubscriptionRecovery productId={lifecycle.productId} />
          </Alert>
        ) : null}
        {lifecycle.kind === "released" ? (
          <Alert severity="warning">
            This subscription was not created here, so cancelling has not removed it.{" "}
            <SubscriptionRecovery productId={lifecycle.productId} />
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
                !isEvaluator &&
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
            <Button disabled={pending} variant="contained" onClick={() => void retry()}>
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
              {pending ? "Creating..." : validHandoff ? "Create linked project" : "Create project"}
            </Button>
          ) : null}
          {/* An attempt that has ended still names a subscription that outlived it, so leaving is
              a deliberate step away from that answer rather than another cancellation. */}
          {lifecycle.kind === "released" || lifecycle.kind === "cleanup-failed" ? (
            <Button onClick={leaveForProjects}>Back to Projects</Button>
          ) : (
            <Button disabled={pending} onClick={cancel}>
              Cancel
            </Button>
          )}
        </Stack>
      </Stack>
    </Container>
  );
};
