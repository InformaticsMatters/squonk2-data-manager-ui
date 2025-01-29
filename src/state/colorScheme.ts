import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { type BaseValue, COLOUR_SCHEME_STORAGE_KEY } from "../utils/next/localStorage";

// State saved to localStorage so we need to know if its old data if we update logic here
const VERSION = 1;

type Scheme = "dark" | "light";

export interface ColorScheme extends BaseValue {
  scheme: Scheme;
}

const initialColorScheme: ColorScheme = {
  version: VERSION,
  scheme: "light",
};

const colorScheme = atomWithStorage(COLOUR_SCHEME_STORAGE_KEY, initialColorScheme);

/**
 * Hook to access and update the colour scheme for the app
 */
export const useColorScheme = () => {
  const [scheme, setScheme] = useAtom(colorScheme);
  return [scheme.scheme, (scheme: Scheme) => setScheme({ version: VERSION, scheme })] as const;
};
