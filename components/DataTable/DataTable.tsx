import type { ReactNode } from 'react';
import { useMemo } from 'react';
import React from 'react';
import type { CellProps, Column, IdType, PluginHook, TableProps, TableRowProps } from 'react-table';
import { useGlobalFilter, useRowSelect, useSortBy, useTable } from 'react-table';

import type { Error as DMError } from '@squonk/data-manager-client';

import type { Interpolation } from '@emotion/react';
import { css } from '@emotion/react';
import type { TableCellProps, TableProps as MuiTableProps, Theme } from '@material-ui/core';
import {
  Box,
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
  Typography,
  useTheme,
} from '@material-ui/core';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';
import type { AxiosError } from 'axios';

import { CenterLoader } from '../CenterLoader';
import { IndeterminateCheckbox } from './IndeterminateCheckbox';

type Selection<Data> = Record<IdType<Data>, boolean>;
type CustomProps<Props> = Partial<Props & { css?: Interpolation<Theme> }>;

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
  error?: void | AxiosError<DMError> | null;
  customTableProps?: CustomProps<TableProps & MuiTableProps>;
  /**
   * Custom props applied to TableCell. Props can either be react-table props or MaterialUI props.
   */
  customCellProps?: CustomProps<TableRowProps & TableCellProps>;
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
export function DataTable<Data extends Record<string, any>>({
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
  isError,
  error,
  customTableProps,
  customCellProps,
}: DataTableProps<Data>) {
  const theme = useTheme();

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
      initialState: {
        selectedRowIds: (initialSelection
          ? Object.fromEntries(initialSelection.map((id) => [id, true]))
          : {}) as Selection<Data>,
      },
      autoResetSortBy: false,
    },
    useGlobalFilter,
    useSortBy,
    useRowSelect,
    useActionsColumnPlugin, // Option to add an actions column
    (hooks) => {
      initialSelection &&
        hooks.visibleColumns.push((columns) => [
          {
            id: 'selection',
            defaultCanSort: false,
            Header: ({ getToggleAllRowsSelectedProps }) => {
              const { onChange, ...props } = getToggleAllRowsSelectedProps();
              return (
                <IndeterminateCheckbox
                  {...props}
                  onChange={(event, checked) => {
                    onSelection && tableData.forEach((row) => onSelection(row, checked));
                    // onSelection && onSelection(row, checked);
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
    },
  );

  const tableContents = (
    <>
      {(ToolbarChild || enableSearch) && (
        <Toolbar
          css={css`
            align-items: flex-start;
            padding-top: ${theme.spacing(2)}px;
            gap: ${theme.spacing(1)}px;
          `}
        >
          {ToolbarChild}
          {enableSearch && (
            <TextField
              css={css`
                margin-left: auto;
              `}
              inputProps={{ 'aria-label': 'search' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon />
                  </InputAdornment>
                ),
              }}
              placeholder={`${preGlobalFilteredRows.length} records...`}
              value={globalFilter || ''}
              onChange={(e) => {
                setGlobalFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
              }}
            />
          )}
        </Toolbar>
      )}

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
                  {column.render('Header')}
                  {column.canSort ? (
                    <TableSortLabel
                      active={column.isSorted}
                      // react-table has a unsorted state which is not treated here
                      direction={column.isSortedDesc ? 'desc' : 'asc'}
                    />
                  ) : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {rows.slice(0, 100).map((row) => {
            prepareRow(row);
            return (
              // eslint-disable-next-line react/jsx-key
              <TableRow {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    // eslint-disable-next-line react/jsx-key
                    <TableCell {...cell.getCellProps(customCellProps)}>
                      {cell.render('Cell')}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {(isLoading || isError) && (
        <Box overflow="hidden" padding={2}>
          {isLoading && <CenterLoader />}
          {isError && (
            <>
              {error?.message && <Typography color="error">{error.message}</Typography>}
              {error?.response && (
                <Typography color="error">{error.response.data.error}</Typography>
              )}
            </>
          )}
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
}
