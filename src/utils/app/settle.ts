/**
 * The outcome of work that was allowed to fail: either the value it produced or the reason it did
 * not produce one.
 */
export type Settled<T> = { ok: false; error: unknown } | { ok: true; value: T };

/**
 * Runs async work and reports how it ended instead of throwing.
 *
 * This exists so components can react to a failure without holding a `try` themselves: the React
 * Compiler cannot yet lower `try`/`catch`/`finally` inside a component, and silently skips any
 * component that contains one. Keeping the `try` out here leaves the component compilable while the
 * handler still says plainly what happens on each outcome.
 */
export const settle = async <T>(work: () => Promise<T>): Promise<Settled<T>> => {
  try {
    return { ok: true, value: await work() };
  } catch (error) {
    return { ok: false, error };
  }
};
