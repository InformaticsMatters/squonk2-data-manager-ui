import type { ReactNode } from 'react';
import React from 'react';
import type { CellProps, Column, IdType, PluginHook } from 'react-table';
import { useGlobalFilter, useRowSelect, useSortBy, useTable } from 'react-table';

import { css } from '@emotion/react';
import {
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
} from '@material-ui/core';
import SearchRoundedIcon from '@material-ui/icons/SearchRounded';

import { IndeterminateCheckbox } from './IndeterminateCheckbox';

type Selection<Data> = Record<IdType<Data>, boolean>;

export interface DataTableProps<Data extends Record<string, any>> {
  tableContainer?: boolean;
  columns: Column<Data>[];
  data: Data[];
  ToolbarChild?: ReactNode;
  getRowId?: (row: Data) => IdType<Data>;
  enableSearch?: boolean;
  initialSelection?: IdType<Data>[];
  onSelection?: (row: Data, checked: boolean) => void;
  useActionsColumnPlugin?: PluginHook<Data>;
}

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
}: DataTableProps<Data>) {
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
      data,
      getRowId,
      initialState: {
        selectedRowIds: (initialSelection
          ? Object.fromEntries(initialSelection.map((id) => [id, true]))
          : {}) as Selection<Data>,
      },
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
            Header: ({ getToggleAllRowsSelectedProps }) => {
              const { onChange, ...props } = getToggleAllRowsSelectedProps();
              return (
                <IndeterminateCheckbox
                  {...props}
                  onChange={(event, checked) => {
                    onSelection && data.forEach((row) => onSelection(row, checked));
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
      <Toolbar>
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
      <Table {...getTableProps()} size="small">
        <TableHead>
          {headerGroups.map((headerGroup) => (
            // eslint-disable-next-line react/jsx-key
            <TableRow {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                // eslint-disable-next-line react/jsx-key
                <TableCell
                  {...(column.id === 'selection'
                    ? column.getHeaderProps()
                    : column.getHeaderProps(column.getSortByToggleProps()))}
                >
                  {column.render('Header')}
                  {column.id !== 'selection' ? (
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
                  // eslint-disable-next-line react/jsx-key
                  return <TableCell {...cell.getCellProps()}>{cell.render('Cell')}</TableCell>;
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );

  const table = tableContainer ? (
    <TableContainer component={Paper}>{tableContents}</TableContainer>
  ) : (
    tableContents
  );

  return table;
}
