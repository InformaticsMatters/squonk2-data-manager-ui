import { type Consent } from "../../state/cookieConsent";
import { type DebugMode } from "../../state/eventDebugMode";

export const EVENT_DEBUG_MODE_STORAGE_KEY = `data-manager-ui-event-debug-mode`;
export const COOKIE_CONSENT_STORAGE_KEY = `data-manager-ui-cookie-consent`;

type Keys = typeof COOKIE_CONSENT_STORAGE_KEY | typeof EVENT_DEBUG_MODE_STORAGE_KEY;

export type BaseValue = { version: number };

interface Values {
  [EVENT_DEBUG_MODE_STORAGE_KEY]: DebugMode;
  [COOKIE_CONSENT_STORAGE_KEY]: Consent;
}

export const writeToLocalStorage = <Key extends Keys>(key: Key, value: Values[Key]) => {
  localStorage.setItem(key, JSON.stringify(value));
};
