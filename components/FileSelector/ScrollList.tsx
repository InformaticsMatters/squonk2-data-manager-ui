import styled from '@emotion/styled';
import { List } from '@material-ui/core';

/**
 * Styled MuiList component with a clamped height.
 */
export const ScrollList = styled(List)`
  min-height: 100px;
  max-height: 30vh;
  overflow-y: auto;
`;
