import { useState } from "react";

import { useAccessCommands } from "../administration/useAccessCommands";
import { useGetPersonalUnit } from "../hooks/useGetPersonalUnit";
import { personalUnitCreationFailureReason } from "./failures";

/** What a personal-unit attempt is doing right now. Its outcome is the unit itself, never a state. */
export type PersonalUnitCreationState =
  | { kind: "creating" }
  | { kind: "failed"; reason: string }
  | { kind: "idle" };

/**
 * Creating the caller's own personal unit, through the same access command Administration sends.
 *
 * **This step deliberately persists no recovery record**, unlike the project creation it sits
 * beside. Project creation persists one because a subscription's identity exists only in a response
 * body, so a lost response orphans a subscription that can never be found again. A personal unit has
 * no such failure mode: there is exactly one, it is the caller's own, and `GET /personal-unit`
 * answers authoritatively whether it exists. Recovery is therefore by observation — every failure
 * refetches that resource, a unit that is now present means the request committed and the step is
 * done, and a unit that is still absent means retrying is safe. That also covers a duplicate
 * attempt, from a second tab or a double submission: the endpoint documents no conflict status, so
 * the refusal arrives as an ordinary bad request and is read back as "you already have one".
 */
export const usePersonalUnitCreation = () => {
  const commands = useAccessCommands();
  const personalUnit = useGetPersonalUnit();
  const [state, setState] = useState<PersonalUnitCreationState>({ kind: "idle" });

  const createPersonalUnit = async () => {
    setState({ kind: "creating" });
    try {
      await commands.createPersonalUnit();
      setState({ kind: "idle" });
    } catch (error) {
      const observed = await personalUnit.refetch();
      setState(
        observed.data
          ? { kind: "idle" }
          : { kind: "failed", reason: personalUnitCreationFailureReason(error) },
      );
    }
  };

  return { createPersonalUnit, personalUnit: personalUnit.data, state };
};
