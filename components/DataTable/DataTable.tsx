import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { ExpandLess } from "@mui/icons-material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type {
  TableCellProps as MuiCellProps,
  TableProps as MuiTableProps,
  TableRowProps as MuiRowProps,
} from "@mui/material";
import {
  Box,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
} from "@mui/material";
import { rankItem } from "@tanstack/match-sorter-utils";
import type {
  ColumnDef,
  CoreOptions,
  ExpandedState,
  FilterFn,
  Row,
  RowSelectionState,
  SortingState,
  Table as RTable,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { IndeterminateCheckbox } from "./IndeterminateCheckbox";

export interface DataTableProps<Data extends Record<string, any>> {
  /**
   * Control whether the table is wrapped inside a MuiPaper. Defaults to `true`
   */
  tableContainer?: boolean;
  /**
   * Array of columns for react-table
   */
  columns: ColumnDef<Data, any>[];
  /**
   * Array of data, compatible with columns, for react-table.
   */
  data?: Data[];
  /**
   * Child element of the toolbar in the table header
   */
  ToolbarChild?: ReactNode;
  /**
   * Toolbar with actions which sits beneath the table header toolbar with search.
   */
  ToolbarActionChild?: ReactNode;
  /**
   * Function to uniquely identify a given row of data
   */
  getRowId?: CoreOptions<Data>["getRowId"];
  /**
   * Whether the search functionality should be enabled. Defaults to true.
   */
  enableSearch?: boolean;
  /**
   * If using row selection, this sets the initial rows that should be selected on first render.
   */
  initialSelection?: string[];
  /**
   * Called when a row is selected or unselected
   */
  onSelection?: (row: Data, checked: boolean) => void;
  /**
   * Enables sub rows.
   */
  subRowsEnabled?: boolean;
  /**
   * Accessor function to row's sub rows. By default, the sub rows are located in the `subRows`
   * attribute.
   */
  getSubRows?: (row: Data, relativeIndex: number) => Data[];
  /**
   * Custom props applied to Table. Props can either be react-table props or MaterialUI props.
   */
  customTableProps?: MuiTableProps;
  /**
   * Custom props applied to TableCell. Props can either be react-table props or MaterialUI props.
   */
  customCellProps?: MuiCellProps;
  /**
   * Custom props applied to TableRow. Props can either be react-table props or MaterialUI props.
   */
  customRowProps?: MuiRowProps | ((row: Row<Data>) => MuiRowProps);
  /**
   * If true, displays the loading icon.
   */
  isLoading?: boolean;
  /**
   * If true, displays the provided `error`.
   */
  error?: string;
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  // Rank the item
  const itemRank = rankItem(row.getValue(columnId), value);

  // Store the itemRank info
  addMeta({
    itemRank,
  });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};

const truncate = <Data,>(table: RTable<Data>) => table.getRowModel().rows.slice(0, 100);

export const DataTable = <Data extends Record<string, any>>(props: DataTableProps<Data>) => {
  const {
    tableContainer = true,
    getRowId,
    enableSearch = true,
    columns,
    data,
    ToolbarActionChild,
    ToolbarChild,
    initialSelection,
    onSelection,
    subRowsEnabled,
    getSubRows,
    customTableProps,
    customCellProps,
    customRowProps,
  } = props;
  const tableData = useMemo(() => data || [], [data]);

  // Table State
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const paddedColumns = useMemo(() => {
    const workingColumns = [...columns];
    if (subRowsEnabled) {
      workingColumns.unshift({
        id: "expander",
        enableSorting: false,
        header: ({ table }) => (
          <Box display="flex">
            <IconButton onClick={table.getToggleAllRowsExpandedHandler()}>
              {table.getIsAllRowsExpanded() ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>
        ),
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <Box {...row.getToggleExpandedHandler()} display="flex">
              {row.getIsExpanded() ? <ExpandLess /> : <ExpandMore />}
            </Box>
          ) : null,
      });

      if (initialSelection) {
        workingColumns.unshift({
          id: "selection",
          enableSorting: false,
          header: ({ table }) => (
            <IndeterminateCheckbox
              checked={table.getIsAllRowsSelected()}
              indeterminate={table.getIsSomeRowsSelected()}
              onChange={(event, checked) => {
                table.getToggleAllRowsSelectedHandler()(event);
                const rows = truncate(table);
                onSelection &&
                  rows
                    .filter((row) => row.getIsSelected())
                    .forEach((row) => onSelection(row.original, checked));
              }}
            />
          ),
          cell: ({ row }) => (
            <IndeterminateCheckbox
              checked={row.getIsSelected()}
              indeterminate={row.getIsSomeSelected()}
              onChange={(event, checked) => {
                row.getToggleSelectedHandler()(event);
                onSelection && onSelection(row.original, checked);
              }}
            />
          ),
        });
      }
    }

    return workingColumns;
  }, [columns, initialSelection, onSelection, subRowsEnabled]);

  const table = useReactTable({
    getRowId,
    data: tableData,
    columns: paddedColumns,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      sorting,
      globalFilter,
      expanded,
      rowSelection,
    },
    initialState: {
      rowSelection: initialSelection
        ? Object.fromEntries(initialSelection.map((id) => [id, true]))
        : {},
    },
    getSubRows,
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getExpandedRowModel: getExpandedRowModel(),
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
  });

  const rows = truncate(table);

  const tableContents = (
    <>
      {(ToolbarChild || enableSearch) && (
        <Toolbar sx={{ pt: 2, alignItems: "flex-start", gap: (theme) => theme.spacing(1) }}>
          {ToolbarChild}
          {enableSearch && (
            <TextField
              inputProps={{ "aria-label": "search" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon />
                  </InputAdornment>
                ),
              }}
              placeholder="Search..."
              sx={{ ml: "auto" }}
              value={globalFilter || ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
            />
          )}
        </Toolbar>
      )}
      {ToolbarActionChild && <Toolbar>{ToolbarActionChild}</Toolbar>}
      <Table size="small" {...customTableProps}>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell
                  className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <Box display="flex">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() ? (
                      <TableSortLabel
                        active={!!header.column.getIsSorted()}
                        // react-table has a unsorted state which is not treated here
                        direction={header.column.getIsSorted() || undefined}
                      />
                    ) : null}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {rows.map((row) => {
            const rowProps =
              typeof customRowProps === "function" ? customRowProps(row) : customRowProps;
            return (
              <TableRow {...rowProps} key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  return (
                    <TableCell
                      {...customCellProps}
                      key={cell.id}
                      sx={{
                        pl: cell.column.getCanSort()
                          ? (theme) => theme.spacing(2 + 2 * row.depth)
                          : undefined,
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );

  return tableContainer ? (
    <TableContainer component={Paper}>{tableContents}</TableContainer>
  ) : (
    tableContents
  );
};
