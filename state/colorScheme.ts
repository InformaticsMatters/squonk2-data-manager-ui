import { useAtom } from "jotai";

import { COLOUR_SCHEME_STORAGE_KEY } from "../constants";
import { atomWithLocalStorage } from "../utils/state/atomWithLocalStorage";

// State saved to localStorage so we need to know if its old data if we update logic here
const VERSION = 1;

type Scheme = "light" | "dark";

interface ColorScheme {
  version: typeof VERSION;
  scheme: Scheme;
}

const defaultColorSchemePayload: ColorScheme = {
  version: VERSION,
  scheme: "light",
};

const colorScheme = atomWithLocalStorage(COLOUR_SCHEME_STORAGE_KEY, defaultColorSchemePayload);

/**
 * Hook to access and update the colour scheme for the app
 */
export const useColorScheme = () => {
  const [scheme, setScheme] = useAtom(colorScheme);
  return [scheme.scheme, (scheme: Scheme) => setScheme({ version: VERSION, scheme })] as const;
};
