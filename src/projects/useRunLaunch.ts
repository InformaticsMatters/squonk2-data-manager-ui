import { useRef, useState } from "react";

import {
  idleLaunch,
  type LaunchAttempt,
  type LaunchEvent,
  launchIsSendable,
  transitionLaunch,
} from "./runLaunch";
import { type LaunchOutcome } from "./useRunCommands";

/**
 * The only way one definition is launched, and the only account of where that launch stands. The
 * attempt itself decides whether a submission may be sent, so a launch already in flight, one the
 * Data Manager accepted, and one it authoritatively refused are each refused here rather than only
 * by whichever control was used — a control that missed a rapid second click, or a caller pressing
 * Enter twice, cannot run the same work twice.
 *
 * `onLaunched` is called only once the Data Manager has accepted the launch, with the execution it
 * created, so nothing downstream can open work that was never run. A failure leaves the modal, its
 * route, and everything entered exactly as they were, because a launch answer is feedback about the
 * launch rather than a navigation event.
 */
export const useRunLaunch = (onLaunched: (outcome: LaunchOutcome) => void) => {
  const [attempt, setAttempt] = useState<LaunchAttempt>(idleLaunch);
  // The attempt is read back within the same event as it is written, which React state alone cannot
  // answer, so the guard reads the attempt itself rather than the last render's copy of it.
  const current = useRef<LaunchAttempt>(idleLaunch);

  const advance = (event: LaunchEvent) => {
    current.current = transitionLaunch(current.current, event);
    setAttempt(current.current);
  };

  return {
    attempt,
    launch: async (send: () => Promise<LaunchOutcome>) => {
      // The one rule about a second submission is asked of the attempt itself, in the same spelling
      // the control beside it uses, so neither can offer what the other refuses.
      if (!launchIsSendable(current.current)) {
        return;
      }
      advance({ kind: "send" });
      try {
        const outcome = await send();
        advance({ kind: "accepted" });
        onLaunched(outcome);
      } catch (error) {
        advance({ kind: "failed", error });
      }
    },
  };
};
