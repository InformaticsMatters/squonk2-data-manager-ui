import {
  Alert,
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { type TransportFailure } from "../api/runtime/classifyTransportFailure";
import { CenterLoader } from "../components/CenterLoader";
import { withBasePath } from "../utils/app/basePath";
import { presentAdministrationFailure } from "./failures";

export const EmptyTask = ({ children }: { children: string }) => (
  <Alert severity="info">
    {children} Contact an organisation owner or your Squonk administrator if you need access.
  </Alert>
);

export const PageTitle = ({ children }: { children: string }) => (
  <Typography component="h2" sx={{ mb: 2 }} variant="h4">
    {children}
  </Typography>
);

export const ResourceLink = ({
  ancestry,
  href,
  id,
  name,
  type,
}: {
  ancestry?: string;
  href: string;
  id: string;
  name: string;
  type: string;
}) => (
  <Card variant="outlined">
    <CardActionArea href={withBasePath(href)}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
          <Typography component="h3" variant="h6">
            {name}
          </Typography>
          <Chip label={type} size="small" variant="outlined" />
        </Stack>
        {ancestry ? <Typography color="text.secondary">{ancestry}</Typography> : null}
        <Typography color="text.secondary" sx={{ overflowWrap: "anywhere" }} variant="caption">
          {id}
        </Typography>
      </CardContent>
    </CardActionArea>
  </Card>
);

export const MissingResource = ({ task }: { task: string }) => (
  <>
    <PageTitle>{task}</PageTitle>
    <Alert severity="warning">This resource is unavailable or you no longer have access.</Alert>
  </>
);

/** The addressed resource has not answered yet; the task and its canonical route already have. */
export const PendingResource = ({ task }: { task: string }) => (
  <>
    <PageTitle>{task}</PageTitle>
    <CenterLoader />
  </>
);

/**
 * The addressed resource answered authoritatively that it cannot be shown. The shared Administration
 * failure contract owns the wording, so a denial and an absence read the same way everywhere.
 */
export const UnavailableResource = ({
  failure,
  task,
}: {
  failure: TransportFailure;
  task: string;
}) => {
  const { message, severity } = presentAdministrationFailure(failure);
  return (
    <>
      <PageTitle>{task}</PageTitle>
      <Alert severity={severity}>{message}</Alert>
    </>
  );
};

export const ResourceIdentity = ({
  ancestry,
  id,
  name,
  type,
}: {
  ancestry?: string;
  id: string;
  name: string;
  type: string;
}) => (
  <>
    <Typography component="h3" variant="h5">
      {name}
    </Typography>
    {ancestry ? <Typography color="text.secondary">{ancestry}</Typography> : null}
    <Box sx={{ my: 2 }}>
      <Divider />
    </Box>
    <Typography sx={{ mb: 0.5 }}>{type} ID</Typography>
    <Typography component="code" sx={{ overflowWrap: "anywhere" }}>
      {id}
    </Typography>
  </>
);

export const ResourceDetailsView = ({
  ancestry,
  id,
  name,
  readOnly,
  task,
  type,
}: {
  ancestry?: string;
  id: string;
  name?: string;
  readOnly: boolean;
  task: string;
  type: string;
}) => {
  if (!name) {
    return <MissingResource task={task} />;
  }

  return (
    <>
      <PageTitle>{task}</PageTitle>
      <ResourceIdentity ancestry={ancestry} id={id} name={name} type={type} />
      {!!readOnly && (
        <Alert severity="info" sx={{ mt: 2 }}>
          This view is read-only. Use Organisation & access or Project Manage for membership
          changes.
        </Alert>
      )}
    </>
  );
};
