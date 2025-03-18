import { type ReactNode, useMemo, useState } from "react";

import {
  ExpandLess,
  ExpandMore as ExpandMoreIcon,
  SearchRounded as SearchRoundedIcon,
} from "@mui/icons-material";
import {
  Box,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  type TableCellProps as MuiCellProps,
  TableContainer,
  TableHead,
  type TableProps as MuiTableProps,
  TableRow,
  type TableRowProps as MuiRowProps,
  TableSortLabel,
  TextField,
  Toolbar,
} from "@mui/material";
import { rankItem } from "@tanstack/match-sorter-utils";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type CoreOptions,
  type ExpandedState,
  type FilterFn,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table as RTable,
  useReactTable,
} from "@tanstack/react-table";

import { IndeterminateCheckbox } from "./IndeterminateCheckbox";

const DEBUG = process.env.NODE_ENV === "development";

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
  toolbarContent?: ReactNode;
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
   * Enable column filters for the table.
   */
  enableColumnFilters?: boolean;
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
  addMeta({ itemRank });

  // Return if the item should be filtered in/out
  return itemRank.passed;
};

const truncate = <Data,>(table: RTable<Data>) => table.getRowModel().rows.slice(0, 100);

export const DataTable = <Data extends Record<string, any>>(props: DataTableProps<Data>) => {
  const {
    tableContainer = true,
    getRowId,
    enableSearch = true,
    enableColumnFilters = false,
    columns,
    data,
    ToolbarActionChild,
    toolbarContent: ToolbarChild,
    initialSelection,
    onSelection,
    subRowsEnabled,
    getSubRows = (row) => row.subRows,
    customTableProps,
    customCellProps,
    customRowProps,
  } = props;
  const tableData = useMemo(() => data ?? [], [data]);

  // Table State
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const paddedColumns = useMemo(() => {
    const workingColumns = [...columns];
    if (subRowsEnabled) {
      workingColumns.unshift({
        id: "expander",
        enableSorting: false,
        header: ({ table }) => (
          <Box sx={{ display: "flex" }}>
            <IconButton onClick={table.getToggleAllRowsExpandedHandler()}>
              {table.getIsAllRowsExpanded() ? <ExpandLess /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        ),
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <IconButton sx={{ display: "flex" }} onClick={row.getToggleExpandedHandler()}>
              {row.getIsExpanded() ? <ExpandLess /> : <ExpandMoreIcon />}
            </IconButton>
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
    enableColumnFilters,
    getRowId,
    data: tableData,
    columns: paddedColumns,
    filterFns: { fuzzy: fuzzyFilter },
    state: { sorting, globalFilter, columnFilters, expanded, rowSelection },
    initialState: {
      rowSelection: initialSelection
        ? Object.fromEntries(initialSelection.map((id) => [id, true]))
        : {},
    },
    getSubRows,
    onExpandedChange: setExpanded,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    globalFilterFn: fuzzyFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getExpandedRowModel: getExpandedRowModel(),
    debugTable: DEBUG,
    debugHeaders: DEBUG,
    debugColumns: DEBUG,
  });

  const rows = truncate(table);

  const tableContents = (
    <>
      {!!ToolbarChild || !!enableSearch ? (
        <Toolbar sx={{ pt: 2, alignItems: "flex-start", gap: 1 }}>
          {ToolbarChild}
          {!!enableSearch && (
            <TextField
              placeholder="Search..."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon />
                    </InputAdornment>
                  ),
                },

                htmlInput: { "aria-label": "search" },
              }}
              sx={{ ml: "auto" }}
              value={globalFilter || ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
            />
          )}
        </Toolbar>
      ) : null}
      {ToolbarActionChild ? <Toolbar>{ToolbarActionChild}</Toolbar> : null}
      <Table size="small" {...customTableProps}>
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableCell
                  className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                  colSpan={header.colSpan}
                  key={header.id}
                >
                  {header.isPlaceholder ? null : (
                    <Box sx={{ textWrap: "nowrap" }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() ? (
                        <TableSortLabel
                          active={!!header.column.getIsSorted()}
                          // react-table has a unsorted state which is not treated here
                          direction={header.column.getIsSorted() || undefined}
                          onClick={header.column.getToggleSortingHandler()}
                        />
                      ) : null}
                      {header.column.getCanFilter() ? (
                        <div>
                          {/* TODO: debounce this field */}
                          <TextField
                            placeholder="Search"
                            value={header.column.getFilterValue()}
                            onChange={(event) => header.column.setFilterValue(event.target.value)}
                          />
                        </div>
                      ) : null}
                    </Box>
                  )}
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
                      sx={(theme) => ({
                        pl: cell.column.getCanSort() ? theme.spacing(2 + 2 * row.depth) : undefined,
                      })}
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
