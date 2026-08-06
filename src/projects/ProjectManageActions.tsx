import { useState } from "react";

import { Alert, Box, Button, FormControlLabel, Stack, Switch, Typography } from "@mui/material";

import { ManageUsers } from "../components/ManageUsers";
import { capabilityIsEnabled, capabilityReason, type ProjectCapability } from "./capabilities";
import { classifyProjectCommandFailure } from "./failures";
import {
  type ProjectCommandOutcome,
  projectOutcomeMessage,
  type ProjectRole,
} from "./projectMutations";
import { useProjectCommands } from "./useProjectCommands";

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
