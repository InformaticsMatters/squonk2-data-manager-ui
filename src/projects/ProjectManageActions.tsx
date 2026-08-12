import { useState } from "react";

import { Alert, Box, Button, FormControlLabel, Stack, Switch, Typography } from "@mui/material";
import { useRouter } from "next/router";

import { ManageUsers } from "../components/ManageUsers";
import { WarningDeleteButton } from "../components/WarningDeleteButton";
import { isProductId, isProjectId, isTaskId } from "../routing/identifiers";
import { capabilityIsEnabled, capabilityReason, type ProjectCapability } from "./capabilities";
import { classifyProjectCommandFailure, projectDeletionFailureReason } from "./failures";
import {
  initialProjectDeletionState,
  type ProjectDeletionState,
  rememberProjectDeletion,
  transitionProjectDeletion,
} from "./projectDeletion";
import {
  type ProjectCommandOutcome,
  projectOutcomeMessage,
  type ProjectRole,
} from "./projectMutations";
import { projectLinks } from "./routes";
import { useProjectCommands } from "./useProjectCommands";
import { useProjectDeletionCommands } from "./useProjectDeletionCommands";

type Feedback = { message: string; severity: "error" | "info" | "success" | "warning" };

/**
 * What one project mutation is doing and what its last attempt answered. Every answer is presented
 * where the control is: the displayed project, its adopted organisation, and the canonical route
 * are untouched, because a server response to a command is feedback rather than a navigation
 * event. A rejection, a transport failure, and a change that was never sent each keep the control
 * usable, so the next step is always available without leaving the project.
 */
const useProjectMutation = () => {
  const [feedback, setFeedback] = useState<Feedback | undefined>();
  const [isPending, setIsPending] = useState(false);

  const run = async (
    projectId: string,
    action: string,
    command: () => Promise<ProjectCommandOutcome>,
  ) => {
    setIsPending(true);
    setFeedback(undefined);
    try {
      const outcome = await command();
      setFeedback({
        message: projectOutcomeMessage(outcome),
        severity: outcome.kind === "unchanged" ? "info" : "success",
      });
    } catch (error) {
      // Every failure is classified into the one sentence the caller shows. Handing the same
      // failure to the shared error presentation as well would answer one command twice, in two
      // places, so the control that was used is the only place any of them is reported.
      const failure = classifyProjectCommandFailure(error, action, `project ${projectId}`);
      setFeedback({
        message: failure.message,
        severity: failure.kind === "rejected" ? "warning" : "error",
      });
    }
    setIsPending(false);
  };

  return { feedback, isPending, run };
};

const MutationFeedback = ({ feedback }: { feedback: Feedback | undefined }) =>
  feedback ? (
    <Alert severity={feedback.severity} sx={{ mt: 1 }}>
      {feedback.message}
    </Alert>
  ) : null;

/**
 * The project's privacy, owned by the project in the URL alone. The switch states the privacy the
 * project has; an unavailable change stays visible and disabled with the reason it requires.
 */
export const ProjectPrivacyControl = ({
  capability,
  isPrivate,
  projectId,
}: {
  capability: ProjectCapability;
  isPrivate: boolean;
  projectId: string;
}) => {
  const commands = useProjectCommands();
  const { feedback, isPending, run } = useProjectMutation();
  const [requested, setRequested] = useState<boolean | undefined>();
  const reason = capabilityReason(capability);

  const change = async (checked: boolean) => {
    setRequested(checked);
    await run(projectId, "change the privacy of", () =>
      commands.setProjectPrivacy(projectId, isPrivate, checked),
    );
    // The project is the authority on its own privacy, so once it has answered the switch states
    // the privacy the project has rather than the privacy that was asked for.
    setRequested(undefined);
  };

  return (
    <Box aria-label="Privacy" component="section">
      <FormControlLabel
        control={
          <Switch
            // While a change is in flight the switch states the privacy it is applying, so a sent
            // change never reads as one the project refused.
            checked={requested ?? isPrivate}
            disabled={!capabilityIsEnabled(capability) || isPending}
            onChange={(_event, checked) => void change(checked)}
          />
        }
        label="Private"
      />
      {reason ? (
        <Typography color="text.secondary" component="p" variant="body2">
          {reason}
        </Typography>
      ) : null}
      <MutationFeedback feedback={feedback} />
    </Box>
  );
};

const roleTitles: Record<ProjectRole, string> = {
  administrator: "Administrators",
  editor: "Editors",
  observer: "Observers",
};

/**
 * One of the project's membership lists. The list as displayed and as edited is the whole input:
 * the command decides which user changed, so this control never has to work it out, and it stays
 * readable while the caller may not change it.
 */
export const ProjectMembersControl = ({
  capability,
  members,
  projectId,
  role,
}: {
  capability: ProjectCapability;
  members: string[];
  projectId: string;
  role: ProjectRole;
}) => {
  const commands = useProjectCommands();
  const { feedback, isPending, run } = useProjectMutation();
  const [input, setInput] = useState("");

  const change = async (next: string[]) => {
    await run(projectId, `change the ${role}s of`, () =>
      commands.changeProjectMembers(projectId, role, members, next),
    );
    setInput("");
  };

  return (
    <Box aria-label={roleTitles[role]} component="section">
      <ManageUsers
        disabled={!capabilityIsEnabled(capability)}
        helperText={capabilityReason(capability)}
        inputValue={input}
        isLoading={isPending}
        title={roleTitles[role]}
        users={members}
        onInputChange={setInput}
        onRemove={change}
        onSelect={change}
      />
      <MutationFeedback feedback={feedback} />
    </Box>
  );
};

/**
 * Where a project deletion begins, and the only place it does.
 *
 * The request is all that happens here: the Data Manager answers with the task doing the work, and
 * the caller is sent to that task's own canonical route before the project underneath them
 * disappears. Nothing is cleared and no subscription is touched on the way out — both belong to the
 * progress route, which can still be reloaded once this project cannot be read at all. A request
 * that was refused stays here with the reason, because there is no progress to monitor yet.
 */
export const ProjectDeletionControl = ({
  capability,
  productId,
  projectId,
  projectName,
}: {
  capability: ProjectCapability;
  productId: string | undefined;
  projectId: string;
  projectName: string;
}) => {
  const commands = useProjectDeletionCommands();
  const router = useRouter();
  const [lifecycle, setLifecycle] = useState<ProjectDeletionState>(initialProjectDeletionState);
  const reason = capabilityReason(capability);
  // Only a subscription this client can address may be carried into the progress route, so an
  // identity the route family would reject leaves the workflow with its Data Manager phase alone.
  const subscriptionId = productId && isProductId(productId) ? productId : undefined;

  const requestDeletion = async () => {
    const input = { projectId, ...(subscriptionId ? { productId: subscriptionId } : {}) };
    // A refused request is retried through the same control, which is the one thing that is safe to
    // send again: a deletion request creates nothing, however often it is made.
    const requesting =
      lifecycle.kind === "request-failed"
        ? transitionProjectDeletion(lifecycle, { kind: "retry" })
        : transitionProjectDeletion(initialProjectDeletionState, { input, kind: "request" });
    setLifecycle(requesting.state);
    // The lifecycle decides whether a request may be sent at all, and names the project it is for,
    // so a state that offers no request sends none rather than being sent one anyway.
    if (requesting.effect?.kind !== "delete-project") {
      return;
    }

    let taskId: string;
    try {
      taskId = await commands.deleteProject(requesting.effect.projectId);
    } catch (error) {
      setLifecycle(
        transitionProjectDeletion(requesting.state, {
          kind: "request-failed",
          reason: projectDeletionFailureReason(error, "project"),
        }).state,
      );
      // Rethrowing keeps the confirmation open, so the same deliberate step is the retry.
      throw error;
    }

    if (!isTaskId(taskId)) {
      // The deletion is running and this client cannot address the task that is doing it, so the
      // identity itself is what the caller is left with rather than a route built from it.
      setLifecycle(
        transitionProjectDeletion(requesting.state, {
          kind: "request-failed",
          reason: `Deletion started, but its progress cannot be followed here. Quote task ${taskId} to support.`,
        }).state,
      );
      throw new Error(`Project deletion task ${taskId} is not addressable`);
    }

    setLifecycle(transitionProjectDeletion(requesting.state, { kind: "requested", taskId }).state);
    // The project this deletion is removing, recorded so the progress route can clear its loaded
    // content once the deletion is confirmed. The route this control mounts on already validated
    // the identity, so the guard narrows the type rather than deciding anything.
    if (isProjectId(projectId)) {
      rememberProjectDeletion(localStorage, { projectId, taskId });
    }
    // Replacing rather than pushing is what stops Back returning to a project that is being removed.
    await router.replace(projectLinks.deletion(taskId, { subscriptionId }) as never);
  };

  return (
    <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
      <WarningDeleteButton
        retainOnError
        modalChildren={
          <>
            <Typography gutterBottom variant="body1">
              You are deleting <b>{projectName}</b> and every file and working directory it holds.{" "}
              <b>This cannot be undone.</b>
            </Typography>
            <Typography variant="body1">
              {subscriptionId
                ? "Its subscription is removed only after the Data Manager confirms the project was deleted."
                : "This project holds no subscription this client can address, so only its Data Manager data is removed."}
            </Typography>
          </>
        }
        modalId={`delete-project-${projectId}`}
        submitText="Delete project"
        title="Delete project"
        onDelete={requestDeletion}
      >
        {({ openModal }) => (
          <Button
            color="error"
            disabled={!capabilityIsEnabled(capability) || lifecycle.kind === "requesting"}
            variant="outlined"
            onClick={openModal}
          >
            Delete project
          </Button>
        )}
      </WarningDeleteButton>
      {reason ? (
        <Typography color="text.secondary" variant="body2">
          {reason}
        </Typography>
      ) : null}
      {lifecycle.kind === "request-failed" ? (
        <Alert severity="error">{lifecycle.reason}</Alert>
      ) : null}
    </Stack>
  );
};

/**
 * The one exclusively platform-administrator project action. Its rejection is presented in place:
 * the project in the URL, the adopted organisation, and the canonical route are untouched, because
 * the server response is authorization feedback rather than a navigation event.
 */
export const PlatformAdministrationAction = ({
  capability,
  projectId,
  username,
}: {
  capability: ProjectCapability;
  projectId: string;
  username: string;
}) => {
  const commands = useProjectCommands();
  const { feedback, isPending, run } = useProjectMutation();
  const reason = capabilityReason(capability);

  return (
    <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
      <Button
        disabled={!capabilityIsEnabled(capability) || isPending}
        variant="outlined"
        onClick={() =>
          void run(projectId, "take administration of", () =>
            commands.takeProjectAdministration(projectId, username),
          )
        }
      >
        Take project administration
      </Button>
      {reason ? (
        <Typography color="text.secondary" variant="body2">
          {reason}
        </Typography>
      ) : null}
      <MutationFeedback feedback={feedback} />
    </Stack>
  );
};
