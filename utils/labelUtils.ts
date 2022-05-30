import type { DatasetVersionSummary } from "@squonk/data-manager-client";

import { mergeWith } from "lodash-es";

/**
 *  Formats `[key: string, value: string | string[]]` pairs into a label string
 *
 * Examples:
 * * `['a', 'b']        -> 'a=b'`
 * * `['a', '']         -> 'a'`
 * * `['a', ['']]       -> 'a'`
 * * `['a', ['b', 'c']] -> 'a=≡'`
 *
 * @param label key of a label
 * @param value value or values of label
 * @returns formatted label string
 */
export const labelFormatter = (label: string, value: string | string[]) => {
  const uniqueValues = Array.from(new Set(value));

  if (value === "" || (uniqueValues.length === 1 && uniqueValues[0] === "")) {
    // case: EMPTY STRING
    return label;
  } else if (typeof value === "string" || uniqueValues.length === 1) {
    // case: SINGLE VALUE
    return `${label}=${typeof value === "string" ? value : value[0]}`;
  }
  // case: MULTI_VALUE
  return `${label}=≡`;
};

type Labels = Record<string, string>;

const reducer = (labelsA: Labels, labelsB: Labels) => {
  // need to make copies of labelsA as it is mutated
  return mergeWith({ ...labelsA }, labelsB, (valuesA, valuesB) => {
    // combine the values - this only happens to matches between object keys
    const values = [valuesA, valuesB].filter((value) => value !== undefined).flat();
    // Remove duplicates before returning
    return Array.from(new Set(values));
  });
};

/**
 * Merges `DatasetVersionSummaryLabels` into  a single objects with a mapping from label key to all
 * the possible values for that key.
 *
 * Example:
 * `[{a: b}, {a: c, d: e}, {f: p}] -> {a: [b,c], d: e, f: p}`
 *
 * @param versions versions containing the labels to be merged
 * @returns A single object with the merged labels
 */
export const combineLabels = (versions: DatasetVersionSummary[]) => {
  // Get all the label objects typed properly
  // The OpenAPI currently only types labels as `{}` so I assert to a Record here.
  const labels = versions.map((version) => (version.labels ?? {}) as Labels);

  // In turn combine each object.
  // I use reduce here as the lodash types don't handle spread parameters well
  const combinedLabels = labels.reduce(reducer);

  return combinedLabels as Record<string, string | string[]>;
};
