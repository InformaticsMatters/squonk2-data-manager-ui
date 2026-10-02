import { useState } from "react";

import { createColumnHelper } from "@tanstack/react-table";

import { AppScaffold } from "../../stories/decorators";
import { DataTable } from "./DataTable";

interface Entry {
  name: string;
  subRows: Entry[];
}

const columnHelper = createColumnHelper<Entry>();
const columns = [columnHelper.accessor("name", { header: "Name" })];

const entries = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const name = `entry-${String(index + 1).padStart(3, "0")}`;
    return { name, subRows: [{ name: `${name}.schema.json`, subRows: [] }] };
  });

export interface ListingProps {
  count?: number;
}

/**
 * A listing of `count` entries, each with one sub-row, whose selections are recorded by name.
 */
export const Listing = ({ count = 150 }: ListingProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <AppScaffold>
      <DataTable
        subRowsEnabled
        columns={columns}
        data={entries(count)}
        getRowId={(row) => row.name}
        initialSelection={[]}
        onSelection={(row, checked) =>
          setSelected((names) =>
            checked
              ? [...new Set([...names, row.name])]
              : names.filter((name) => name !== row.name),
          )
        }
      />
      <form hidden>
        <input readOnly data-testid="selected" value={String(selected.length)} />
      </form>
    </AppScaffold>
  );
};
