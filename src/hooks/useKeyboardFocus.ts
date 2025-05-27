import { useEffect, useRef } from "react";

import { isMac } from "../utils/platform";

/**
 * Hook that provides a ref and keyboard shortcut (Ctrl+F/Cmd+F) to focus an input field
 */
export const useKeyboardFocus = () => {
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isCorrectModifier = isMac()
        ? event.metaKey && !event.ctrlKey
        : event.ctrlKey && !event.metaKey;

      if (isCorrectModifier && event.key === "f") {
        event.preventDefault();
        inputRef.current?.querySelector("input")?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return inputRef;
};
