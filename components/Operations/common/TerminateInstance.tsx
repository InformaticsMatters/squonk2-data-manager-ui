import type { FC } from 'react';
import { useState } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import type { InstanceSummary } from '@squonk/data-manager-client';
import {
  getGetInstancesQueryKey,
  useTerminateInstance,
} from '@squonk/data-manager-client/instance';

import { Button, Typography } from '@material-ui/core';

import { ModalWrapper } from '../../Modals/ModalWrapper';

interface TerminateInstanceProps {
  instance: InstanceSummary;
}

export const TerminateInstance: FC<TerminateInstanceProps> = ({ instance }) => {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const { mutate: terminateInstance } = useTerminateInstance();
  return (
    <>
      <ModalWrapper
        id={`delete-instance-${instance.id}`}
        open={open}
        submitText="Delete"
        title="Delete Instance"
        onClose={() => setOpen(false)}
        onSubmit={() => {
          terminateInstance(
            { instanceid: instance.id },
            {
              onSuccess: () => {
                queryClient.invalidateQueries(getGetInstancesQueryKey());
                queryClient.invalidateQueries(
                  getGetInstancesQueryKey({ project_id: instance.project_id }),
                );
                setOpen(false);
              },
            },
          );
        }}
      >
        <Typography variant="body1">
          Are you sure? <b>This cannot be undone</b>.
        </Typography>
      </ModalWrapper>
      <Button onClick={() => setOpen(true)}>Terminate</Button>
    </>
  );
};
