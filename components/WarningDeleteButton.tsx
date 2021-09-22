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
  title: string;
  modalId: string;
  submitText?: string;
  tooltipText: string;
  modalChildren?: ReactNode;
  children: ({ openModal, isDeleting }: DeleteButtonProps) => ReactNode;
  onDelete: () => Promise<void>;
}

const defaultChild = (
  <Typography variant="body1">
    Are you sure? <b>This cannot be undone</b>.
  </Typography>
);

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
      <Tooltip title={tooltipText}>
        <span>{children({ openModal: () => setOpen(true), isDeleting })}</span>
      </Tooltip>
    </>
  );
};
