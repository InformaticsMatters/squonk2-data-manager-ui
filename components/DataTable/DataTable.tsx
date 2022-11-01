import type { ReactNode } from "react";
import { useMemo } from "react";
import type {
  Cell,
  CellProps,
  Column,
  IdType,
  PluginHook,
  Row,
  TableCellProps,
  TableProps,
  TableRowProps,
} from "react-table";
import { useExpanded, useGlobalFilter, useRowSelect, useSortBy, useTable } from "react-table";

import type { Interpolation } from "@emotion/react";
import { ExpandLess } from "@mui/icons-material";
import ExpandMore from "@mui/icons-material/ExpandMore";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import type {
  TableCellProps as MuiCellProps,
  TableProps as MuiTableProps,
  TableRowProps as MuiRowProps,
  Theme,
} from "@mui/material";
import {
  Alert,
  Box,
  InputAdornment,
  LinearProgress,
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

import { IndeterminateCheckbox } from "./IndeterminateCheckbox";

type Selection<Data> = Record<IdType<Data>, boolean>;
type CustomProps<Props> = Partial<Props & { css?: Interpolation<Theme> }>;

type CustomRowProps = CustomProps<TableRowProps & MuiRowProps>;
type CustomCellProps = CustomProps<TableCellProps & MuiCellProps>;
type CustomTableProps = CustomProps<TableProps & MuiTableProps>;

export interface DataTableProps<Data extends Record<string, any>> {
  /**
   * Control whether the table is wrapped inside a MuiPaper. Defaults to `true`
   */
  tableContainer?: boolean;
  /**
   * Array of columns for react-table
   */
  columns: Column<Data>[];
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
  getRowId?: (row: Data) => IdType<Data>;
  /**
   * Whether the search functionality should be enabled. Defaults to true.
   */
  enableSearch?: boolean;
  /**
   * If using row selection, this sets the initial rows that should be selected on first render.
   */
  initialSelection?: IdType<Data>[];
  /**
   * Called when a row is selected or unselected
   */
  onSelection?: (row: Data, checked: boolean) => void;
  /**
   * Custom actions column placed as the last column.
   */
  useActionsColumnPlugin?: PluginHook<Data>;
  /**
   * Array of data, compatible with columns, for react-table.
   */
  data?: Data[];
  /**
   * If true, displays the loading icon.
   */
  isLoading?: boolean;
  /**
   * If true, displays the provided `error`.
   */
  isError?: boolean;
  /**
   * Error to display. The error is displayed only if `isError` is true.
   */
  error?: string;
  /**
   * Custom props applied to Table. Props can either be react-table props or MaterialUI props.
   */
  customTableProps?: CustomTableProps;
  /**
   * Custom props applied to TableCell. Props can either be react-table props or MaterialUI props.
   */
  customCellProps?: CustomCellProps;
  /**
   * Custom props applied to TableRow. Props can either be react-table props or MaterialUI props.
   */
  customRowProps?: CustomRowProps | ((row: Row<Data>) => CustomRowProps);
  /*
   * Enables sub rows.
   */
  subRowsEnabled?: boolean;
  /**
   * Accessor function to row's sub rows. By default, the sub rows are located in the `subRows`
   * attribute.
   */
  getSubRows?: (row: Data, relativeIndex: number) => Data[];
}

// Use a *function* here to avoid the issues with generics in arrow functions
/**
 * Generic table component using react-table and MuiTable.
 *
 * *Example*:
 * ```tsx
 * <DataTable columns={columns} data={datasets} getRowId={(row) => row.dataset_id} />
 * ```
 */
export const DataTable = <Data extends Record<string, any>>(props: DataTableProps<Data>) => {
  const {
    tableContainer = true,
    columns,
    data,
    ToolbarChild,
    getRowId,
    enableSearch = true,
    initialSelection,
    onSelection,
    useActionsColumnPlugin = () => {
      // Do nothing
    },
    isLoading,
    error,
    customTableProps,
    customCellProps,
    customRowProps,
    getSubRows,
    subRowsEnabled,
    ToolbarActionChild,
  } = props;

  // According to react-table data passed to it should be memoized to avoid expensive recalculations
  const tableData = useMemo(() => data || [], [data]);

  const {
    getTableProps,
    headerGroups,
    rows,
    prepareRow,
    preGlobalFilteredRows,
    setGlobalFilter,
    state: { globalFilter },
  } = useTable(
    {
      columns,
      data: tableData,
      getRowId,
      getSubRows,
      initialState: {
        selectedRowIds: (initialSelection
          ? Object.fromEntries(initialSelection.map((id) => [id, true]))
          : {}) as Selection<Data>,
      },
      autoResetSortBy: false,
    },
    useGlobalFilter,
    useSortBy,
    useExpanded,
    useRowSelect,
    useActionsColumnPlugin, // Option to add an actions column
    (hooks) => {
      initialSelection &&
        hooks.visibleColumns.push((columns) => [
          {
            id: "selection",
            defaultCanSort: false,
            Header: ({ getToggleAllRowsSelectedProps, rows }) => {
              const { onChange, ...props } = getToggleAllRowsSelectedProps();
              return (
                <IndeterminateCheckbox
                  {...props}
                  onChange={(event, checked) => {
                    onSelection && rows.forEach((row) => onSelection(row.original, checked));
                    onChange && onChange(event);
                  }}
                />
              );
            },
            Cell: ({ row }: CellProps<Data>) => {
              const { onChange, ...props } = row.getToggleRowSelectedProps();
              return (
                <IndeterminateCheckbox
                  {...props}
                  onChange={(event, checked) => {
                    onSelection && onSelection(row.original, checked);
                    onChange && onChange(event);
                  }}
                />
              );
            },
          },
          ...columns,
        ]);
      subRowsEnabled &&
        hooks.visibleColumns.unshift((columns) => [
          {
            id: "expander",
            defaultCanSort: false,
            Header: ({ getToggleAllRowsExpandedProps, isAllRowsExpanded }) => (
              <Box {...getToggleAllRowsExpandedProps()} display="flex">
                {isAllRowsExpanded ? <ExpandLess /> : <ExpandMore />}
              </Box>
            ),
            Cell: ({ row }: Cell<Data>) =>
              row.canExpand ? (
                <Box {...row.getToggleRowExpandedProps()} display="flex">
                  {row.isExpanded ? <ExpandLess /> : <ExpandMore />}
                </Box>
              ) : null,
          },
          ...columns,
        ]);
    },
  );

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
              placeholder={`${preGlobalFilteredRows.length} records...`}
              sx={{ ml: "auto" }}
              value={globalFilter || ""}
              onChange={(e) => {
                setGlobalFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
              }}
            />
          )}
        </Toolbar>
      )}
      {ToolbarActionChild && <Toolbar>{ToolbarActionChild}</Toolbar>}
      <Table {...getTableProps(customTableProps)} size="small">
        <TableHead>
          {headerGroups.map((headerGroup) => (
            // eslint-disable-next-line react/jsx-key
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                // eslint-disable-next-line react/jsx-key
                <TableCell
                  {...(!column.canSort
                    ? column.getHeaderProps()
                    : column.getHeaderProps(column.getSortByToggleProps()))}
                >
                  <Box display="flex">
                    {column.render("Header")}
                    {column.canSort ? (
                      <TableSortLabel
                        active={column.isSorted}
                        // react-table has a unsorted state which is not treated here
                        direction={column.isSortedDesc ? "desc" : "asc"}
                      />
                    ) : null}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {rows.slice(0, 100).map((row) => {
            prepareRow(row);

            const rowProps =
              typeof customRowProps === "function" ? customRowProps(row) : customRowProps;

            return (
              // eslint-disable-next-line react/jsx-key
              <TableRow {...row.getRowProps(rowProps)}>
                {row.cells.map((cell) => {
                  return (
                    // eslint-disable-next-line react/jsx-key
                    <TableCell
                      {...cell.getCellProps(customCellProps)}
                      sx={{
                        pl: cell.column.canSort
                          ? (theme) => theme.spacing(2 + 2 * row.depth)
                          : undefined,
                      }}
                    >
                      {cell.render("Cell")}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {isLoading && <LinearProgress />}
      {error && (
        <Box overflow="hidden" padding={2}>
          {<Alert severity="error">{error}</Alert>}
        </Box>
      )}
    </>
  );

  const table = tableContainer ? (
    <TableContainer component={Paper}>{tableContents}</TableContainer>
  ) : (
    tableContents
  );

  return table;
};
