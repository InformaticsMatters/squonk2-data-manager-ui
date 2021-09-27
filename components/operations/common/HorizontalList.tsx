import styled from '@emotion/styled';
import { List } from '@material-ui/core';

/**
 * MuiList but items are displayed in a row. On the end is a
 */
export const HorizontalList = styled(List)`
  padding: 0;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  & > li {
    width: auto;
  }
`;
