import { type ReactNode } from "react";

import { Box, Divider, Skeleton, type SxProps, type Theme, Typography } from "@mui/material";

import { cardGridSx } from "./runCards/cardGrid";
import { DataTable, type DataTableProps } from "./DataTable";

/**
 * Announces a placeholder as loading, so assistive technology hears a wait, not empty shapes. `sx`
 * lets it stand in a layout as the placeholder it wraps would, such as a flex item.
 */
export const Loading = ({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) => (
  <Box aria-busy aria-label="Loading" role="status" sx={sx}>
    {children}
  </Box>
);

/**
 * A listing that has not answered: its real column headings over placeholder rows. It is the
 * DataTable itself, loading, so the toolbar, headings and footer are where the listing puts them,
 * and its body is what announces the wait. A listing with sub rows or a selection passes the same
 * options, so its leading columns are there before the data is and the headings do not move, and a
 * listing with a larger toolbar passes that toolbar's shape so the rows start where they will stay.
 */
export const ListingSkeleton = ({
  columns,
  ...options
}: Pick<
  DataTableProps<Record<string, never>>,
  | "initialSelection"
  | "loadingRowHeight"
  | "subRowsEnabled"
  | "ToolbarActionChild"
  | "toolbarContent"
> & {
  /** The listing's headings, with the widths it declares for them, if it declares any. */
  columns: readonly (string | { header: string; width?: string })[];
}) => (
  <DataTable
    isLoading
    columns={columns.map((column) => {
      const { header, width } = typeof column === "string" ? { header: column } : column;
      return { header, id: header, meta: { width } };
    })}
    {...options}
  />
);

/** A detail view's identity block that has not answered, shaped like `ResourceIdentity`. */
export const IdentitySkeleton = () => (
  <Loading>
    <Typography component="div" variant="h5">
      <Skeleton width="40%" />
    </Typography>
    <Box sx={{ my: 2 }}>
      <Divider />
    </Box>
    <Typography sx={{ mb: 0.5 }}>
      <Skeleton width={80} />
    </Typography>
    <Typography>
      <Skeleton width="60%" />
    </Typography>
  </Loading>
);

/**
 * A definition card's height with a typical name, summary and footer. A card is as tall as its own
 * content, so this is the one most cards in a catalogue settle at, not a promise about every card.
 */
const definitionCardHeight = 239;

/** The Run catalogue's grid of cards, not yet answered. */
export const CardGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <Loading>
    <Box sx={cardGridSx}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton height={definitionCardHeight} key={index} variant="rounded" />
      ))}
    </Box>
  </Loading>
);
