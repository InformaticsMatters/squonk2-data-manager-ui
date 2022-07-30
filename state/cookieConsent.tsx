import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { EVENT_DEBUG_MODE_STORAGE_KEY } from "../constants";

// State saved to localStorage so we need to know if its old data if we update logic here
const VERSION = 1;

interface Consent {
  version: typeof VERSION;
  consent: boolean;
}

const initialConsent: Consent = {
  version: VERSION,
  consent: false,
};

const cookieConsent = atomWithStorage(EVENT_DEBUG_MODE_STORAGE_KEY, initialConsent);

/**
 * Hook to access and update the persisted cookie consent value
 */
export const useCookieConsent = () => {
  const [{ consent }, setConsent] = useAtom(cookieConsent);
  return [
    consent,
    (consent: Consent["consent"]) => setConsent({ version: VERSION, consent }),
  ] as const;
};
