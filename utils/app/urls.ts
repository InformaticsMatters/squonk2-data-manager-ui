/**
 * Manage the *file* Protocol used in file selectors
 */

import { type InputData } from "../../components/runCards/JobCard/JobModal";

export const FILE_PROTOCOL = "file://";

/**
 * Literal file protocol type
 */
export type FILE_PROTOCOL = typeof FILE_PROTOCOL;

export const removeFileProtocol = (file: string) =>
  file.startsWith(FILE_PROTOCOL) ? file.slice(FILE_PROTOCOL.length) : file;

export const removeFileProtocolFromInputData = (file: InputData[string]) => {
  if (Array.isArray(file)) {
    return file.map((f) => removeFileProtocol(f));
  } else if (typeof file === "string") {
    return removeFileProtocol(file);
  }
};

export const addFileProtocol = (file: string) => `${FILE_PROTOCOL}${file}`;
