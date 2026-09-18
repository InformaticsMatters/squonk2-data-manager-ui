import { type InstanceGetResponse } from "@/api/data-manager";

import { Alert } from "@mui/material";

import {
  resultInstanceJob,
  resultInstanceKind,
  type ResultInstanceLifecycle,
} from "../../projects/instanceFacts";
import { InstanceOverview } from "./InstanceOverview";
import { JobDetails } from "./JobDetails";

/**
 * What the instance's own read last said about its progress. An instance that failed says so with
 * the Data Manager's own words, one the cluster could not start says that instead of an outcome, a
 * read that could not be made says that instead of either, and none of them is ever presented as an
 * instance that finished its work.
 */
const InstanceLifecycleAlert = ({ lifecycle }: { lifecycle: ResultInstanceLifecycle }) => {
  switch (lifecycle.kind) {
    case "failed":
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          {lifecycle.reason}
        </Alert>
      );
    case "stalled":
    case "unconfirmed":
    case "unknown":
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {lifecycle.reason}
        </Alert>
      );
    case "pending":
      return (
        <Alert severity="info" sx={{ mb: 2 }}>
          This instance is still running.
        </Alert>
      );
    case "succeeded":
    case "unestablished":
      return null;
  }
};

export interface InstanceProgressProps {
  /** The addressed instance's own read; nothing here is fetched a second time. */
  instance: InstanceGetResponse;
  lifecycle: ResultInstanceLifecycle;
}

/**
 * What one instance ran, as far as its own type accounts for it. A job accounts for the definition
 * it ran and the files it was given and produced; an application accounts for what every instance
 * records. An instance of a type this client has no rule for says so rather than being presented
 * as one of the two, and still accounts for what every instance records.
 */
const InstanceKindDetails = ({ instance }: { instance: InstanceGetResponse }) => {
  switch (resultInstanceKind(instance)) {
    case "application":
      return <InstanceOverview instance={instance} />;
    case "job":
      return <JobDetails instance={instance} jobId={resultInstanceJob(instance)} />;
    case undefined:
      return (
        <>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This client has no rule for what kind of work this instance ran, so only what every
            instance records is shown.
          </Alert>
          <InstanceOverview instance={instance} />
        </>
      );
  }
};

/**
 * What one instance did, presented under what its lifecycle says about it. Both come from the one
 * read of the addressed instance, so the outcome stated here and the detail shown beneath it always
 * describe the same instance.
 */
export const InstanceProgress = ({ instance, lifecycle }: InstanceProgressProps) => (
  <>
    <InstanceLifecycleAlert lifecycle={lifecycle} />
    <InstanceKindDetails instance={instance} />
  </>
);
