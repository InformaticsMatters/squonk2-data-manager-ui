import { useEffect, useRef } from "react";

/**
 * Hook that provides a ref and keyboard shortcut (Ctrl+F/Cmd+F) to focus an input field
 */
export const useKeyboardFocus = () => {
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault();
        inputRef.current?.querySelector("input")?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return inputRef;
};
