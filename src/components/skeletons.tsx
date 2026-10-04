import { type ReactNode } from "react";

import { Box, Divider, Skeleton, Typography } from "@mui/material";

import { cardGridSx } from "./runCards/cardGrid";
import { DataTable } from "./DataTable";

/** Announces a placeholder as loading, so assistive technology hears a wait, not empty shapes. */
export const Loading = ({ children }: { children: ReactNode }) => (
  <Box aria-busy aria-label="Loading" role="status">
    {children}
  </Box>
);

/**
 * A listing that has not answered: its real column headings over placeholder rows. It is the
 * DataTable itself, loading, so the toolbar, headings and footer are where the listing puts them,
 * and its body is what announces the wait.
 */
export const ListingSkeleton = ({ columns }: { columns: string[] }) => (
  <DataTable isLoading columns={columns.map((header) => ({ id: header, header }))} />
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

/** The Run catalogue's grid of cards, not yet answered. */
export const CardGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <Loading>
    <Box sx={cardGridSx}>
      {Array.from({ length: count }, (_, index) => (
        <Skeleton height={200} key={index} variant="rounded" />
      ))}
    </Box>
  </Loading>
);
