import { useState } from "react";

import { Button } from "@mui/material";

import { AppScaffold } from "../stories/decorators";
import { WarningDeleteButton } from "./WarningDeleteButton";

/**
 * The confirmation resolves, so the modal closes and the deletion is recorded once.
 */
export const Confirming = () => {
  const [deletions, setDeletions] = useState(0);

  return (
    <AppScaffold>
      <WarningDeleteButton
        modalId="delete-project"
        title="Delete project"
        tooltipText="Delete this project"
        onDelete={() => {
          setDeletions((count) => count + 1);
          return Promise.resolve();
        }}
      >
        {({ openModal, isDeleting }) => (
          <Button disabled={isDeleting} onClick={openModal}>
            Delete
          </Button>
        )}
      </WarningDeleteButton>
      <form hidden>
        <input readOnly data-testid="deletions" value={String(deletions)} />
      </form>
    </AppScaffold>
  );
};

/**
 * The confirmation rejects with `retainOnError`, so the modal stays open for a retry.
 */
export const RetainingOnError = () => {
  const [attempts, setAttempts] = useState(0);

  return (
    <AppScaffold>
      <WarningDeleteButton
        retainOnError
        modalId="delete-failing"
        submitText="Delete anyway"
        title="Delete instance"
        onDelete={() => {
          setAttempts((count) => count + 1);
          return Promise.reject(new Error("Deletion failed"));
        }}
      >
        {({ openModal }) => <Button onClick={openModal}>Delete</Button>}
      </WarningDeleteButton>
      <form hidden>
        <input readOnly data-testid="attempts" value={String(attempts)} />
      </form>
    </AppScaffold>
  );
};

export interface CustomisedProps {
  title?: string;
  submitText?: string;
}

/**
 * Parametric variant for asserting how the modal presents arbitrary wording.
 */
export const Customised = ({
  title = "Delete resource",
  submitText = "Delete",
}: CustomisedProps) => (
  <AppScaffold>
    <WarningDeleteButton
      modalId="delete-customised"
      submitText={submitText}
      title={title}
      onDelete={() => Promise.resolve()}
    >
      {({ openModal }) => <Button onClick={openModal}>Delete</Button>}
    </WarningDeleteButton>
  </AppScaffold>
);
