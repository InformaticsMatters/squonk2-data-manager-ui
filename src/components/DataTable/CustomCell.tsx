import styled from 'styled-components';

import { Table } from '@devexpress/dx-react-grid-material-ui';
import { Chip as MuiChip } from '@material-ui/core';

import { useProjects } from '../../hooks';
import { Dataset } from '../../Services/apiTypes';
import DeleteButton from './DeleteButton';
import DownloadButton from './DownloadButton';
import EditButton from './EditButton';

enum ColumnTypes {
  ACTIONS = 'actions',
  LABELS = 'labels',
  PROJECTS = 'projects',
}

type IProps = Omit<Table.DataCellProps, 'row'> & {
  row: Dataset;
};

/**
 * Display rich content based on column name
 */
const CustomCell: React.FC<IProps> = ({ row, column, ...rest }) => {
  const { projects } = useProjects();
  switch (column.name) {
    case ColumnTypes.ACTIONS:
      return (
        <Cell row={row} column={column} {...rest}>
          <DownloadButton dataset={row} />
          <DeleteButton dataset={row} />
          <EditButton dataset={row} />
        </Cell>
      );
    case ColumnTypes.LABELS:
      return (
        <Cell row={row} column={column} {...rest}>
          {row.labels.map((label, index) => (
            <Chip key={index} label={label} />
          ))}
        </Cell>
      );
    case ColumnTypes.PROJECTS:
      return (
        <Cell row={row} column={column} {...rest}>
          {row.projects.map((projectId) => {
            const name = projects.find((project) => project.projectId === projectId)?.name;
            return <Chip key={projectId} label={name} />;
          })}
        </Cell>
      );
    default:
      return <Cell row={row} column={column} {...rest} />;
  }
};

export default CustomCell;

const Cell = styled(Table.Cell)`
  padding-top: 0;
  padding-bottom: 0;
`;

const Chip = styled(MuiChip)`
  margin: ${({ theme }) => theme.spacing(0.5)}px;
`;
