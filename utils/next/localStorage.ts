import { type ProjectLocalStoragePayload } from "../../hooks/projectHooks";
import { type ColorScheme } from "../../state/colorScheme";
import { type Consent } from "../../state/cookieConsent";
import { type DebugMode } from "../../state/eventDebugMode";
import { type FileState } from "../../state/fileSelection";

export const COLOUR_SCHEME_STORAGE_KEY = `data-manager-ui-colorScheme`;
export const PROJECT_LOCAL_STORAGE_KEY = `data-manager-ui-current-project`;
export const PROJECT_FILE_LOCAL_STORAGE_KEY = `data-manager-ui-selected-files`;
export const EVENT_DEBUG_MODE_STORAGE_KEY = `data-manager-ui-event-debug-mode`;
export const COOKIE_CONSENT_STORAGE_KEY = `data-manager-ui-cookie-consent`;

type Keys =
  | typeof COLOUR_SCHEME_STORAGE_KEY
  | typeof COOKIE_CONSENT_STORAGE_KEY
  | typeof EVENT_DEBUG_MODE_STORAGE_KEY
  | typeof PROJECT_FILE_LOCAL_STORAGE_KEY
  | typeof PROJECT_LOCAL_STORAGE_KEY;

export type BaseValue = { version: number };

interface Values {
  [COLOUR_SCHEME_STORAGE_KEY]: ColorScheme;
  [PROJECT_LOCAL_STORAGE_KEY]: ProjectLocalStoragePayload;
  [PROJECT_FILE_LOCAL_STORAGE_KEY]: FileState;
  [EVENT_DEBUG_MODE_STORAGE_KEY]: DebugMode;
  [COOKIE_CONSENT_STORAGE_KEY]: Consent;
}

export const getFromLocalStorage = <Key extends Keys>(
  key: Key,
  defaultValue: Values[Key],
): Values[Key] => {
  try {
    const value = localStorage.getItem(key);
    if (value !== null) {
      return JSON.parse(value) as Values[Key];
    }
    return defaultValue;
  } catch {
    return defaultValue;
  }
};

export const writeToLocalStorage = <Key extends Keys>(key: Key, value: Values[Key]) => {
  localStorage.setItem(key, JSON.stringify(value));
};
