// Module-level promise that resolves once the auth token is first set.
// Axios interceptors on the DM and AS clients await this before sending any request,
// so React Query queries queue silently rather than firing unauthenticated.
// After the gate opens it stays open — the promise is already resolved for all
// subsequent requests, so there is zero overhead on the hot path.

let release: () => void;
const gate = new Promise<void>((resolve) => {
  release = resolve;
});

export const awaitTokenGate = () => gate;
// Safe to call multiple times — Promise.resolve is idempotent.
export const releaseTokenGate = () => release();
