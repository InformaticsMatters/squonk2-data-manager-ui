import { useStateResetOn } from "./useStateResetOn";

/**
 * A local draft of a value owned elsewhere, for inputs that must not push every keystroke back to
 * their owner.
 *
 * The draft follows the committed value whenever that changes underneath it — a revert, a refetch,
 * a sibling edit — so the input never shows an answer its owner has already replaced.
 */
export const useDraftValue = <V>(value: V) => useStateResetOn(value, (committed) => committed);
