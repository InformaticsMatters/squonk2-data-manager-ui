import type { DatasetVersionSummary } from '@squonk/data-manager-client';

import { mergeWith } from 'lodash-es';

/**
 *
 * @param label key of a label
 * @param value value or values of label
 * @returns formatted label string
 */
export const labelFormatter = (label: string, value: string | string[]) => {
  const valueString = typeof value === 'string' ? value : '';
  return label + (valueString ? `=${valueString}` : '');
};

export const combineLabels = (versions: DatasetVersionSummary[]) => {
  const labels = versions.map((version) => (version.labels ?? {}) as Record<string, string>);

  const combinedLabels = labels.reduce((labelsA, labelsB) =>
    mergeWith({ ...labelsA }, { ...labelsB }, (valuesA, valuesB) =>
      [valuesA, valuesB].filter((value) => value !== undefined).flat(),
    ),
  );

  return combinedLabels as Record<string, string | string[]>;
};
