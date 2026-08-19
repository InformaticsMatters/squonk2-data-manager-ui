import { useEffect, useEffectEvent, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Container,
  LinearProgress,
  Link as MuiLink,
  Stack,
  Typography,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/router";

import { administrationLinks } from "../administration/routes";
import { useFamilyRoute } from "../application/FamilyRouteResolution";
import { isProductId } from "../routing/identifiers";
import { projectDeletionFailureReason } from "./failures";
import { removeUnavailableProject } from "./projectCache";
import {
  forgetProjectDeletion,
  pollingProjectDeletionState,
  type ProjectDeletionEffect,
  projectDeletionIsPending,
  type ProjectDeletionState,
  type ProjectDeletionTransition,
  readProjectDeletionRecovery,
  transitionProjectDeletion,
} from "./projectDeletion";
import { projectLinks } from "./routes";
import { type ResultTaskLifecycle } from "./taskFacts";
import { useProjectDeletionCommands } from "./useProjectDeletionCommands";
import { useResultTask } from "./useResultTask";

/** One identifier this workflow can be quoted by, whether or not it can be linked. */
const Diagnostic = ({ label, value }: { label: string; value: string }) => (
  <Stack
    component="li"
    direction={{ xs: "column", sm: "row" }}
    spacing={{ sm: 1 }}
    sx={{ py: 0.25 }}
  >
    <Typography color="text.secondary" sx={{ minWidth: 160 }}>
      {label}
    </Typography>
    <Typography component="span" sx={{ overflowWrap: "anywhere" }}>
      {value}
    </Typography>
  </Stack>
);

/**
 * What the caller is told about one phase of the deletion. Only a phase that failed offers an
 * action, and it offers only the request that is safe to make again.
 */
const phasePresentation = (
  state: ProjectDeletionState,
): { message: string; retry?: string; severity: "error" | "info" | "success" | "warning" } => {
  switch (state.kind) {
    case "polling":
      return { message: "The Data Manager is deleting this project's data.", severity: "info" };
    case "delete-unconfirmed":
      return { message: state.reason, severity: "warning" };
    case "delete-unusable":
      return { message: state.reason, retry: "Check again", severity: "warning" };
    case "delete-failed":
      return { message: state.reason, severity: "error" };
    case "cleaning-up":
      return { message: "Removing this project's subscription.", severity: "info" };
    case "cleanup-failed":
      return { message: state.reason, retry: "Retry subscription deletion", severity: "error" };
    case "completed":
      return {
        message: "This project and its subscription have been deleted.",
        severity: "success",
      };
    // The request phase belongs to Manage; this route is only ever entered with a task in hand.
    case "collecting":
    case "request-failed":
    case "requesting":
      return { message: "This deletion has not started.", severity: "info" };
  }
};

/**
 * The canonical progress resource for one project deletion, addressed by the Data Manager task
 * doing the work and the subscription that has to outlive it.
 *
 * It lives outside the project on purpose: the project it describes stops being readable partway
 * through, so nothing about this route may depend on reading it. The task and the subscription in
 * the URL are the entire workflow identity, which is why a reload — even one long after the project
 * has gone — resumes exactly the same deletion, and why nothing else about the caller's scope is
 * carried here. Each phase answers for its own service, and the Account Server is reached only
 * after the Data Manager confirms the project's data was deleted with an exit code of zero.
 */
export const ProjectDeletionProgress = () => {
  const familyRoute = useFamilyRoute();
  const route = familyRoute.localNotFound ? null : familyRoute.route;
  if (route?.kind !== "deletion") {
    throw new Error("Project deletion requires the canonical deletion route");
  }
  const router = useRouter();
  const queryClient = useQueryClient();
  const commands = useProjectDeletionCommands();
  const deletionTask = useResultTask(route.taskId);
  const [lifecycle, setLifecycle] = useState<ProjectDeletionState>(() =>
    pollingProjectDeletionState(route.taskId, route.subscriptionId),
  );

  /**
   * What a confirmed deletion means for content this browser still holds. Only a task the Data
   * Manager reported done with an exit code of zero reaches here, so a transient read failure or a
   * nonzero exit never removes anything the caller might still have access to.
   */
  const clearDeletedProject = () => {
    const recovery = readProjectDeletionRecovery(localStorage);
    if (recovery?.taskId === route.taskId) {
      removeUnavailableProject(queryClient, localStorage, recovery.projectId);
    }
  };

  const runEffect = async (effect: ProjectDeletionEffect, state: ProjectDeletionState) => {
    if (effect.kind === "read-deletion-task") {
      deletionTask.refetch();
      return;
    }
    if (effect.kind === "delete-project") {
      // Unreachable: this route is only ever entered with a task the request already returned, so
      // no state it can hold transitions into a request. Naming it keeps the effect channel total.
      throw new Error("A deletion request cannot be made from the progress route");
    }
    try {
      await commands.deleteSubscription(effect.productId);
    } catch (error) {
      setLifecycle(
        transitionProjectDeletion(state, {
          kind: "cleanup-failed",
          reason: projectDeletionFailureReason(error, "subscription"),
        }).state,
      );
      return;
    }
    setLifecycle(transitionProjectDeletion(state, { kind: "cleanup-succeeded" }).state);
  };

  const applyTransition = async (transition: ProjectDeletionTransition) => {
    setLifecycle(transition.state);
    if (transition.effect) {
      await runEffect(transition.effect, transition.state);
    }
  };

  /**
   * The task's own account of itself, handed to the lifecycle. The lifecycle decides what may
   * follow it; nothing here interprets an exit code or chooses to reach the Account Server.
   */
  const applyProgress = useEffectEvent((taskLifecycle: ResultTaskLifecycle) => {
    if (taskLifecycle.kind === "succeeded") {
      clearDeletedProject();
    }
    void applyTransition(
      transitionProjectDeletion(lifecycle, { kind: "progress", lifecycle: taskLifecycle }),
    );
  });

  /**
   * Each answer the task gave, handed over exactly once.
   *
   * The read is re-rendered far more often than it answers, so this depends on when it last
   * answered rather than on the object carrying that answer. Depending on the lifecycle alone would
   * lose a read that failed the same way twice — which is precisely what a retry produces when the
   * service has not recovered, and would leave the retry that asked for it waiting for ever.
   */
  useEffect(() => {
    applyProgress(deletionTask.lifecycle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the answer, not the object holding it
  }, [deletionTask.updatedAt]);

  /**
   * Both phases succeeded, so the workflow is over: its record goes, and the caller lands on the
   * index rather than on a project that no longer exists.
   */
  useEffect(() => {
    if (lifecycle.kind !== "completed") {
      return;
    }
    forgetProjectDeletion(localStorage);
    void router.replace(projectLinks.index() as never);
  }, [lifecycle.kind, router]);

  const presentation = phasePresentation(lifecycle);
  const pending = projectDeletionIsPending(lifecycle);
  const subscriptionId = route.subscriptionId;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <div>
          <Typography component="h1" variant="h3">
            Deleting project
          </Typography>
          <Typography color="text.secondary">
            This page follows the deletion itself, so it stays available once the project cannot be
            opened.
          </Typography>
        </div>

        <Alert severity={presentation.severity}>{presentation.message}</Alert>
        {pending ? <LinearProgress /> : null}

        <Box component="section">
          <Typography gutterBottom component="h2" variant="h6">
            Support
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1 }}>
            Quote these identifiers when you contact your Squonk administrator.
          </Typography>
          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
            <Diagnostic label="Deletion task ID" value={route.taskId} />
            {/* A route that names no subscription says so, rather than leaving the caller to
                wonder whether one is still to be removed. */}
            <Diagnostic
              label="Subscription ID"
              value={subscriptionId ?? "None — no subscription is being removed."}
            />
          </Box>
          {/* Every phase reaches Administration, because a caller left with a failure needs
              somewhere to take it whether or not this deletion names a subscription. */}
          {subscriptionId && isProductId(subscriptionId) ? (
            <MuiLink
              component={Link}
              href={administrationLinks.subscription(subscriptionId) as never}
              sx={{ display: "inline-block", mt: 1 }}
            >
              Open this subscription in Administration
            </MuiLink>
          ) : (
            <MuiLink
              component={Link}
              href={administrationLinks.subscriptions() as never}
              sx={{ display: "inline-block", mt: 1 }}
            >
              Open Subscriptions in Administration
            </MuiLink>
          )}
        </Box>

        {lifecycle.kind === "delete-failed" ? (
          <Alert severity="warning">
            The subscription was left exactly as it was, because a project whose data was not
            deleted must keep the record that describes it.
          </Alert>
        ) : null}

        <Stack direction="row" spacing={2}>
          {presentation.retry ? (
            <Button
              disabled={pending}
              variant="contained"
              onClick={() =>
                void applyTransition(transitionProjectDeletion(lifecycle, { kind: "retry" }))
              }
            >
              {presentation.retry}
            </Button>
          ) : null}
          <Button component={Link} href={projectLinks.index()}>
            Back to Projects
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};
