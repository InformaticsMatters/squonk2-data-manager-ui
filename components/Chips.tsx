import { styled } from '@mui/material/styles';

export interface ChipsProps {
  /**
   * Spacing in theme units for the gap between labels. Defaults to 0.5 == 4px.
   */
  spacing?: number;
}

/**
 * Wrapper component that provides spacing to one or more MUI <Chip /> components
 */
export const Chips = styled('div', { shouldForwardProp: (prop) => prop !== 'spacing' })<ChipsProps>(
  ({ spacing = 0.5, theme }) => ({
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    '& > *': {
      margin: theme.spacing(spacing),
    },
  }),
);
