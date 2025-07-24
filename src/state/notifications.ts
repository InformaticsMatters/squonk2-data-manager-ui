import { atom, useAtom } from "jotai";

/**
 * Atom to track the number of unread event notifications
 */
export const unreadEventCountAtom = atom(0);

/**
 * Hook to access and update the unread event count
 */
export const useUnreadEventCount = () => {
  const [count, setCount] = useAtom(unreadEventCountAtom);

  const incrementCount = () => setCount((prev) => prev + 1);
  const resetCount = () => setCount(0);

  return { count, incrementCount, resetCount };
};
