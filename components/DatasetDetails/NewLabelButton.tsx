import type { FC } from 'react';
import React from 'react';
import { useQueryClient } from 'react-query';

import type { DatasetVersionDetail } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, useAddAnnotations } from '@squonk/data-manager-client/dataset';

import { css } from '@emotion/react';
import { Button, IconButton, Popover, Tooltip } from '@material-ui/core';
import { useTheme } from '@material-ui/core';
import AddCircleOutlineRoundedIcon from '@material-ui/icons/AddCircleOutlineRounded';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import * as yup from 'yup';

import type { TableDataset } from '../DataTable/types';

export interface NewLabelButtonProps {
  datasetId: TableDataset['dataset_id'];
  datasetVersion: DatasetVersionDetail;
}

export const NewLabelButton: FC<NewLabelButtonProps> = ({ datasetId, datasetVersion }) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { mutateAsync: addAnnotations } = useAddAnnotations();

  const popupState = usePopupState({ variant: 'popover', popupId: `add-label-${datasetId}` });

  return (
    <>
      <Tooltip title="Add a new label">
        <IconButton size="small" {...bindTrigger(popupState)}>
          <AddCircleOutlineRoundedIcon />
        </IconButton>
      </Tooltip>
      <Popover
        {...bindPopover(popupState)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Formik
          validateOnMount
          initialValues={{ label: '', value: '' }}
          validationSchema={yup.object().shape({
            label: yup.string().required('A label name is required'),
            value: yup.string().required('A label value is required'),
          })}
          onSubmit={async ({ label, value }) => {
            await addAnnotations({
              datasetid: datasetId,
              datasetversion: datasetVersion.version,
              data: {
                annotations: JSON.stringify([
                  { label, value, type: 'LabelAnnotation', active: true },
                ]),
              },
            });

            await queryClient.invalidateQueries(getGetDatasetsQueryKey());
            popupState.close();
          }}
        >
          {({ submitForm, isSubmitting, isValid }) => (
            <Form>
              <div
                css={css`
                  display: flex;
                  align-items: baseline;
                  gap: ${theme.spacing(1)}px;
                `}
              >
                <Field
                  autoFocus
                  component={TextField}
                  inputProps={{ maxLength: 18 }}
                  label="Name"
                  name="label"
                />
                <Field
                  component={TextField}
                  inputProps={{ maxLength: 18 }}
                  label="Value"
                  name="value"
                />
                <Button disabled={isSubmitting || !isValid} onClick={submitForm}>
                  Add
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Popover>
    </>
  );
};
