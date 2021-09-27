import type { ReactNode } from 'react';
import { useState } from 'react';
import React from 'react';

import { Tooltip, Typography } from '@material-ui/core';

import { ModalWrapper } from './modals/ModalWrapper';

export interface DeleteButtonProps {
  isDeleting: boolean;
  openModal: () => void;
}

export interface WarningDeleteButtonProps {
  /**
   * Title of the modal.
   */
  title: string;
  /**
   * ID of the modal for accessibility.
   */
  modalId: string;
  /**
   * Text displayed in the primary action. Defaults to `"Delete"`.
   */
  submitText?: string;
  /**
   * Text displayed in the tooltip wrapped around the child.
   */
  tooltipText: string;
  /**
   * JDX to be rendered inside the main section of the modal.
   */
  modalChildren?: ReactNode;
  /**
   * Button-like component that control the modal visibility.
   */
  children: ({ openModal, isDeleting }: DeleteButtonProps) => ReactNode;
  /**
   * Called when the primary action is triggered.
   */
  onDelete: () => Promise<void>;
}

const defaultChild = (
  <Typography variant="body1">
    Are you sure? <b>This cannot be undone</b>.
  </Typography>
);

/**
 * Dialog that asks the user to confirm a destructive action
 */
export const WarningDeleteButton = ({
  title,
  modalId,
  submitText = 'Delete',
  tooltipText,
  modalChildren = defaultChild,
  children,
  onDelete,
}: WarningDeleteButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  return (
    <>
      <Tooltip title={tooltipText}>
        <span>{children({ openModal: () => setOpen(true), isDeleting })}</span>
      </Tooltip>

      <ModalWrapper
        id={modalId}
        open={open}
        submitDisabled={isDeleting}
        submitText={submitText}
        title={title}
        onClose={() => setOpen(false)}
        onSubmit={async () => {
          setIsDeleting(true);
          await onDelete();
          setIsDeleting(false);
          setOpen(false);
        }}
      >
        {modalChildren}
      </ModalWrapper>
    </>
  );
};
