import { type InstanceGetResponse } from "@/api/data-manager";

import { JobModal } from "../components/runCards/JobCard/JobModal";
import { type ProjectCapability } from "./capabilities";
import { type RerunTarget } from "./resultRerun";

/**
 * The addressed instance's job, offered again with everything that instance ran it with. The one
 * project this is composed for is the target's own verified project, which is both the project the
 * capability was decided by and the project the launch names, so a rerun cannot be sent for a
 * pairing this client would not display.
 *
 * The prefilled interaction is the job modal itself, unchanged: an instance carries what it was
 * run with, so running it again starts from exactly that and stays editable before it is sent.
 *
 * Everything the modal holds — what was entered into it, and how far its launch got — belongs to
 * the one instance of the one project it was addressed for, so it is keyed by that identity and
 * moving between two reruns starts the second one afresh.
 */
export const ProjectResultRerun = ({
  capability,
  instance,
  target,
  onClose,
  onLaunched,
}: {
  capability: ProjectCapability;
  /** The addressed instance's own read, which is what the form takes its defaults from. */
  instance: InstanceGetResponse;
  target: RerunTarget;
  onClose: () => void;
  onLaunched: (instanceId: string) => void;
}) => (
  <JobModal
    open
    // A rerun addresses an instance rather than a catalogue version, so the Data Manager declares
    // no availability of its own here; only the owning project decides.
    capabilities={{ availability: { status: "enabled" }, launch: capability }}
    instance={instance}
    jobId={target.jobId}
    key={`${target.projectId}-${target.instanceId}`}
    projectId={target.projectId}
    onClose={onClose}
    onLaunched={(outcome) => {
      // A rerun runs a job, and every job launch the Data Manager accepts is an instance, so this
      // is the only outcome a rerun can be answered with.
      if (outcome.kind === "instance") {
        onLaunched(outcome.instanceId);
      }
    }}
  />
);
