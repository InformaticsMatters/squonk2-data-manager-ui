import { useState } from "react";

import { type UnitAllDetail } from "@/api/account-server";
import {
  getGetPersonalUnitQueryKey,
  getGetPersonalUnitQueryOptions,
} from "@/api/account-server/unit";

import { useQueryClient } from "@tanstack/react-query";

import { useCreatePersonalUnitCommand } from "../hooks/usePersonalUnitCommands";
import { personalUnitCreationFailureReason } from "./failures";

/** What a personal-unit attempt is doing right now. Its outcome is the unit itself, never a state. */
export type PersonalUnitCreationState =
  { kind: "creating" } | { kind: "failed"; reason: string } | { kind: "idle" };

/**
 * How one attempt ended, for a caller that reports it somewhere the control itself is not. `settled`
 * covers both a request that succeeded and one whose failure the personal unit's own existence
 * settled afterwards, because the caller is in the same place either way: they have their unit. It
 * carries the unit so that whoever announces the step can name what now exists, and leaves it
 * undefined rather than inventing a name where the read has not answered.
 */
export type PersonalUnitCreationOutcome =
  { kind: "failed"; reason: string } | { kind: "settled"; unit: UnitAllDetail | undefined };

/**
 * Creating the caller's own personal unit, through the one command that sends `PUT /personal-unit`.
 *
 * **This step deliberately persists no recovery record**, unlike the project creation it sits
 * beside. Project creation persists one because a subscription's identity exists only in a response
 * body, so a lost response orphans a subscription that can never be found again. A personal unit has
 * no such failure mode: there is exactly one, it is the caller's own, and `GET /personal-unit`
 * answers authoritatively whether it exists. Recovery is therefore by observation — every failure
 * re-reads that resource, a unit that is now present means the request committed and the step is
 * done, and a unit that is still absent means retrying is safe. That also covers a duplicate
 * attempt, from a second tab or a double submission: the endpoint documents no conflict status, so
 * the refusal arrives as an ordinary bad request and is read back as "you already have one".
 *
 * That re-read is a one-shot fetch into the shared cache rather than a subscription, because this
 * runs inside a control the personal unit's own absence put on screen. Subscribing here would
 * refetch on mount and unsettle the very read that decided to render it.
 */
export const usePersonalUnitCreation = () => {
  const queryClient = useQueryClient();
  const create = useCreatePersonalUnitCommand();
  const [state, setState] = useState<PersonalUnitCreationState>({ kind: "idle" });

  const createPersonalUnit = async (): Promise<PersonalUnitCreationOutcome> => {
    setState({ kind: "creating" });
    try {
      await create();
      setState({ kind: "idle" });
      // The command refreshes the personal unit before it resolves, so the unit read back here is
      // the one that now exists rather than the absence this control was put on screen by.
      return {
        kind: "settled",
        unit: queryClient.getQueryData<UnitAllDetail>(getGetPersonalUnitQueryKey()),
      };
    } catch (error) {
      const observed = await queryClient
        .fetchQuery(getGetPersonalUnitQueryOptions({ query: { retry: false } }))
        .catch(() => undefined);
      if (observed) {
        setState({ kind: "idle" });
        return { kind: "settled", unit: observed };
      }
      const reason = personalUnitCreationFailureReason(error);
      setState({ kind: "failed", reason });
      return { kind: "failed", reason };
    }
  };

  return { createPersonalUnit, state };
};
