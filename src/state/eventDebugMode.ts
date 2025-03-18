import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { type BaseValue, EVENT_DEBUG_MODE_STORAGE_KEY } from "../utils/next/localStorage";

// State saved to localStorage so we need to know if its old data if we update logic here
const VERSION = 1;
export interface DebugMode extends BaseValue {
  debug: boolean;
}

const initialDebugMode: DebugMode = { version: VERSION, debug: false };

const debugMode = atomWithStorage(EVENT_DEBUG_MODE_STORAGE_KEY, initialDebugMode);

/**
 * Hook to access and update the persisted event debug setting for instance events
 */
export const useEventDebugMode = () => {
  const [{ debug }, setDebug] = useAtom(debugMode);
  return [debug, (debug: DebugMode["debug"]) => setDebug({ version: VERSION, debug })] as const;
};
