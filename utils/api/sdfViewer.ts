import type { JSON_SCHEMA_TYPE } from "../app/jsonSchema";

export interface ConfigForProperty {
  field: string;
  dtype: JSON_SCHEMA_TYPE;
  include: boolean;
  cardView: boolean;
  min: number;
  max: number;
  sort: string;
}

export type SDFViewerConfig = Record<string, ConfigForProperty>;

export const censorConfig = (config: SDFViewerConfig): string =>
  JSON.stringify(config, (key, value) => {
    if (key === "min") {
      if (value === "") {
        value = -Infinity;
      }
      if (value === -Infinity) {
        return { isInfinity: true, sign: -1 };
      }
    }
    if (key === "max") {
      if (value === "") {
        value = Infinity;
      }
      if (value === Infinity) {
        return { isInfinity: true, sign: +1 };
      }
    }

    return value;
  });

export const uncensorConfig = (config: string): SDFViewerConfig =>
  JSON.parse(config, (key, value) => {
    if (key === "min" || key === "max") {
      if (typeof value === "object" && value !== null && value.isInfinity) {
        return value.sign * Infinity;
      }
    }

    return value;
  });
