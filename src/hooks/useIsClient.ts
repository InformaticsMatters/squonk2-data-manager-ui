import { useSyncExternalStore } from "react";

/** Nothing ever changes this answer within a mount, so no subscriber is ever called. */
const unsubscribe = () => undefined;
const subscribe = () => unsubscribe;
const onClient = () => true;
const onServer = () => false;

/**
 * Whether this render is happening in the browser.
 *
 * For subtrees that can only be drawn once a browser is present — anything reading `window`, or an
 * API whose read must not happen during the server render. `useSyncExternalStore` says this
 * directly, rather than an effect that sets a flag and costs a second render to do it.
 */
export const useIsClient = () => useSyncExternalStore(subscribe, onClient, onServer);
