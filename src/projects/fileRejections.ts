import { type FileError, type FileRejection } from "react-dropzone";

import { nullEmptyString } from "../utils/text";

/**
 * Every rule react-dropzone can refuse a file for, in the words the caller is shown.
 *
 * It reports a broken rule twice: as a stable code, and as prose it generates from the configured
 * limit. The code is the part it documents, so the sentence is written here; the prose is what a
 * rule this table does not name — a `validator` of the application's own — has to say for itself,
 * and is kept for exactly that. Each rule is written without a subject of its own, so one rejected
 * file and several read the same way.
 *
 * A rule only fires where the drop target configures its limit, and the Files drop target
 * configures none, so today none of these is reached. They are written for the whole of what the
 * library reports rather than for the one limit that arrives first, so configuring one is a change
 * to the drop target alone.
 */
const ruleDescriptions: Partial<Record<string, string>> = {
  "file-invalid-type": "not a file type this directory accepts",
  "file-too-large": "larger than the size this directory accepts",
  "file-too-small": "smaller than the size this directory accepts",
  "too-many-files": "too many files were dropped at once",
};

/** How many rejected files a sentence names before it counts them instead. */
const namesListed = 3;

/** What one broken rule reads as, or nothing where the rejection accounted for itself with none. */
const ruleFrom = ({ code, message }: FileError): string | null =>
  ruleDescriptions[code] ?? nullEmptyString(message.trim()) ?? null;

/** Every rule one rejection broke, as the one clause they are stated in. */
const rulesBroken = ({ errors }: FileRejection): string =>
  errors
    .map((error) => ruleFrom(error))
    .filter((rule) => rule !== null)
    .join("; ");

/** The files a sentence is about: named while a reader can take them in, counted beyond that. */
const fileSubject = (names: readonly string[]): string => {
  if (names.length > namesListed) {
    return `${names.length} files`;
  }
  const last = names.at(-1);

  return names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${last}` : `${last}`;
};

/**
 * One sentence per rule a drop broke, naming the files that broke it.
 *
 * A rejection the dropzone raises never reaches the Data Manager, so the reason is the client's own
 * and stating it is the client's job: the caller is told which rule stopped the file, because that
 * is what decides whether they pick a different file or a different type. A rejection that named
 * no rule at all is still reported: it did not upload, and that is the fact the caller needs most.
 */
export const fileRejectionMessages = (rejections: readonly FileRejection[]): string[] => {
  // Files are gathered by rule rather than reported one by one, because a whole drop refused for
  // one reason — which is what `too-many-files` always is — would otherwise say the same thing
  // once per file. They are gathered under the words their rules read as rather than under the
  // codes behind them, because a rule this application does not name speaks for itself: two files
  // can share a code and still have been refused in different words, and only files that would be
  // told the same thing belong in the same sentence.
  const byRule = new Map<string, string[]>();
  for (const rejection of rejections) {
    const rules = rulesBroken(rejection);
    byRule.set(rules, [...(byRule.get(rules) ?? []), rejection.file.name]);
  }

  return [...byRule].map(([rules, names]) => {
    const verb = names.length > 1 ? "were rejected" : "was rejected";

    return rules ? `${fileSubject(names)} ${verb}: ${rules}.` : `${fileSubject(names)} ${verb}.`;
  });
};
