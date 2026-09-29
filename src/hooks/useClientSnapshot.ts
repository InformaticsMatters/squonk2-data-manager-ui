import { useSyncExternalStore } from "react";

/** Nothing here is subscribed to: the value is read once the browser exists, not watched. */
const unsubscribe = () => undefined;
const subscribe = () => unsubscribe;

/**
 * A value only the browser can answer, read without the server render disagreeing with it.
 *
 * The server is given `serverValue` and the browser reads for itself after hydration, so a value
 * held in browser storage reaches the screen without an effect writing it into state — and without
 * the extra committed render that write would cost.
 *
 * `read` is called on every render, so it must return an equal value each time it is asked the same
 * question: primitives, or something cached by its caller. A fresh object every call would loop.
 */
export const useClientSnapshot = <V>(read: () => V, serverValue: V) =>
  useSyncExternalStore(subscribe, read, () => serverValue);
