/**
 * Manage the *file* Protocol used in file selectors
 */

export const FILE_PROTOCOL = "file://";

/**
 * Literal file protocol type
 */
export type FILE_PROTOCOL = typeof FILE_PROTOCOL;

export const removeFileProtocol = (file: string) =>
  file.startsWith(FILE_PROTOCOL) ? file.slice(FILE_PROTOCOL.length) : file;

export const addFileProtocol = (file: string) => `${FILE_PROTOCOL}${file}`;
