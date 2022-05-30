import { useEffect, useMemo } from "react";

import { useImmer } from "use-immer";

import type { TableDataset, TableDatasetSubRow } from ".";

/**
 * A hook used to save selected sub rows. In case a row has been selected, add/remove only its sub
 * rows since they represent a concrete dataset's version.
 */
export const useSelectedDatasets = (baseData: TableDataset[]) => {
  const [selected, setSelected] = useImmer(new Set<TableDatasetSubRow>());

  useEffect(() => {
    setSelected(new Set());
  }, [baseData, setSelected]);

  const add = (data: TableDatasetSubRow) => {
    setSelected((draft) => {
      draft.add(data);
    });
  };

  const remove = (data: TableDatasetSubRow) => {
    setSelected((draft) => {
      draft.delete(data);
    });
  };

  const onSelection = (data: TableDataset, selected: boolean) => {
    // In case a row (not sub row) has been selected, recursively call this function for each its
    // sub rows
    if (data.type === "row") {
      data.subRows.forEach((subRow) => {
        onSelection(subRow, selected);
      });
    } else {
      if (selected) {
        add(data);
      } else {
        remove(data);
      }
    }
  };

  const selectedDatasets = useMemo(() => Array.from(selected), [selected]);

  return { selectedDatasets, onSelection };
};
