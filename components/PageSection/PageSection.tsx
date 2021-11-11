import type { FC } from 'react';

import { Box, Typography } from '@material-ui/core';

import { PageSectionProvider } from './PageSectionProvider';
import type { PageSectionLevel } from './types';
import { usePageSectionContext } from './usePageSectionContext';

export interface PageSectionProps {
  /**
   * If provided, overrides the derived level from PageSectionContext. Used for displaying a heading
   * element.
   */
  level?: PageSectionLevel;
  /**
   * Heading for the section
   */
  title: string;
}

const BASE_LEVEL = 2;
const LAST_ACCEPTABLE_LEVEL = 6;

/**
 * A component which creates a section with a heading. Every inner PageSection child has its `level`
 * one level higher than its parent (unless overridden). It's especially useful to remove repeating
 * code as well as to keep consistency between sections.
 */
export const PageSection: FC<PageSectionProps> = ({ level, title, children }) => {
  const { level: contextLevel } = usePageSectionContext();

  // The component's level is determined in this order: use `level` if provided, if not use the
  // `level` provided by the context, if even that is not provided use `BASE_LEVEL`.
  const realLevel: PageSectionLevel = level ?? contextLevel ?? BASE_LEVEL;
  const nextLevel =
    realLevel < LAST_ACCEPTABLE_LEVEL
      ? ((realLevel + 1) as PageSectionLevel) // This is safe since a check is performed
      : LAST_ACCEPTABLE_LEVEL;

  // Used for styling, it's level lower and can go to '1' hence the type
  const componentLevel = (realLevel - 1) as PageSectionLevel | 1;

  return (
    <PageSectionProvider level={nextLevel}>
      <Box component="section" marginBottom={4}>
        <Typography gutterBottom component={`h${componentLevel}`} variant={`h${realLevel}`}>
          {title}
        </Typography>
        {children}
      </Box>
    </PageSectionProvider>
  );
};
