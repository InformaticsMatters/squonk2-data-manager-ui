import { useCallback, useEffect } from 'react';

import { useImmer } from 'use-immer';

import type { TableDataset } from '.';

export const useSelectedDatasets = (baseData: TableDataset[]) => {
  const [selected, setSelected] = useImmer(new Set<TableDataset>());

  useEffect(() => {
    setSelected(new Set());
  }, [baseData, setSelected]);

  const add = useCallback(
    (data: TableDataset) => {
      setSelected((draft) => {
        draft.add(data);
      });
    },
    [setSelected],
  );

  const remove = useCallback(
    (data: TableDataset) => {
      setSelected((draft) => {
        draft.delete(data);
      });
    },
    [setSelected],
  );

  const onSelection = useCallback(
    (data: TableDataset, selected: boolean) => {
      if (data.type === 'row') {
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
    },
    [add, remove],
  );

  return { selected, onSelection };
};
