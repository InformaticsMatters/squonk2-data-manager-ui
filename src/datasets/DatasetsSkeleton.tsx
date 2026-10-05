import { Box, Container, IconButton, Skeleton, TextField, Typography } from "@mui/material";

import { type DatasetSection } from "../application/pagePolicy";
import { UploadDatasetIcon } from "../components/icons";
import { ListingSkeleton, Loading } from "../components/skeletons";
import { DatasetsFilterToolbar } from "../features/DatasetsTable/DatasetsFilterToolbar";

/**
 * The datasets listing's headings and the widths it declares, shared with its skeleton so the
 * columns are where they will stay. The file name takes whatever the others leave.
 */
export const datasetsColumns = {
  fileName: { header: "File Name" },
  labels: { header: "Labels", width: "14%" },
  editors: { header: "Editors", width: "18%" },
  versions: { header: "Versions", width: "12%" },
  numberOfProjects: { header: "Number of projects", width: "16%" },
} as const;

/** A datasets row's height, set by the selection checkbox every row has. */
const datasetsRowHeight = 50;

/** The upload button before its code and capability have arrived: in place, and disabled. */
export const DatasetUploadPlaceholder = () => (
  <IconButton disabled aria-label="Upload dataset" size="large">
    <UploadDatasetIcon />
  </IconButton>
);

/** A filter before the listing has arrived: its own label in its own place, disabled. */
const FilterPlaceholder = ({ label }: { label: string }) => (
  <TextField disabled fullWidth label={label} />
);

/**
 * The datasets table, not yet answered, under the toolbar it will have. The upload button and the
 * filters are disabled in place rather than drawn as placeholders, since what they are is known;
 * the bulk actions are hidden until a selection exists, so only their row is held.
 */
export const DatasetsListingSkeleton = () => (
  <ListingSkeleton
    subRowsEnabled
    columns={Object.values(datasetsColumns)}
    initialSelection={[]}
    loadingRowHeight={datasetsRowHeight}
    ToolbarActionChild={<Box />}
    toolbarContent={
      <>
        <DatasetUploadPlaceholder />
        <DatasetsFilterToolbar
          fullWidthFilters={<FilterPlaceholder label="Filter by label" />}
          shrinkableFilters={[
            <FilterPlaceholder key="owner" label="Filter by owner" />,
            <FilterPlaceholder key="editor" label="Filter by editor" />,
            <FilterPlaceholder key="fileType" label="Filter by file type" />,
          ]}
        />
      </>
    }
  />
);

/**
 * What a Datasets page shows before the route, session or API clients are ready, chosen from the
 * page's policy alone because none of those can be read yet. It lives apart from the workspace so
 * the page composition can render it without loading the table.
 */
export const DatasetsSkeleton = ({ section }: { section: DatasetSection }) =>
  section === "viewer" ? (
    <Container maxWidth="xl">
      <Loading>
        <Skeleton height={36} sx={{ mt: 2 }} width={220} />
        <Skeleton height="70vh" sx={{ mt: 2 }} variant="rounded" />
      </Loading>
    </Container>
  ) : (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Not the page's heading yet: that says the workspace has arrived. */}
      <Typography gutterBottom component="div" variant="h3">
        Datasets
      </Typography>
      <DatasetsListingSkeleton />
    </Container>
  );
