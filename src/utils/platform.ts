/**
 * Detects if the current platform is macOS using modern APIs
 */
export const isMac = () => {
  if (typeof navigator === "undefined") {
    return false;
  }

  // Modern approach using userAgentData (Chrome 90+)
  if ("userAgentData" in navigator) {
    const userAgentData = (navigator as any).userAgentData;
    if (userAgentData?.platform) {
      return userAgentData.platform === "macOS";
    }
  }

  // Fallback to userAgent string parsing
  return (/Mac|iPhone|iPad|iPod/u).test(navigator.userAgent);
};

/**
 * Returns the platform-specific keyboard shortcut text for search
 */
export const getSearchShortcut = () => {
  return isMac() ? "⌘F" : "Ctrl+F";
};
