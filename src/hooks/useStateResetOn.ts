import { useState } from "react";

/**
 * State that is recomputed whenever `key` changes, without an effect.
 *
 * This is the shape of every "reset when the prop changes" effect in this application: a value the
 * component owns between renders, which nonetheless has to give way when the thing it was derived
 * from becomes something else — a route rewritten under a field, a definition arriving after its
 * form was drawn, a list replaced under a highlight.
 *
 * Doing the comparison during render rather than in an effect is what React itself recommends
 * (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes):
 * the stale value is never rendered, and the correction costs no extra committed render.
 *
 * @param key what the state is derived from; a change to it discards the state
 * @param compute the value to start from, given the key
 */
export const useStateResetOn = <K, V>(key: K, compute: (key: K) => V) => {
  const [value, setValue] = useState(() => compute(key));
  const [lastKey, setLastKey] = useState(key);

  if (!Object.is(key, lastKey)) {
    const next = compute(key);
    setLastKey(key);
    setValue(next);
    // The render this happens in is discarded, so the caller is handed the new value rather than
    // the one it is replacing.
    return [next, setValue] as const;
  }

  return [value, setValue] as const;
};
