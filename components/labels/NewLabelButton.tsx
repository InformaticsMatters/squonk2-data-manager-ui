import { useQueryClient } from 'react-query';

import type { DmError } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey } from '@squonk/data-manager-client/dataset';
import { useAddMetadata } from '@squonk/data-manager-client/metadata';

import { css } from '@emotion/react';
import { Button, IconButton, Popover, Tooltip } from '@material-ui/core';
import { useTheme } from '@material-ui/core';
import AddCircleOutlineRoundedIcon from '@material-ui/icons/AddCircleOutlineRounded';
import { Field, Form, Formik } from 'formik';
import { TextField } from 'formik-material-ui';
import { bindPopover, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import * as yup from 'yup';

import { useEnqueueError } from '../../hooks/useEnqueueStackError';
import { LowerCaseTextField } from '../../utils/LowerCaseTextField';
import type { TableDataset } from '../DatasetsTable';

export interface NewLabelButtonProps {
  /**
   * ID of the dataset
   */
  datasetId: TableDataset['dataset_id'];
}

export const NewLabelButton = ({ datasetId }: NewLabelButtonProps) => {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { mutateAsync: addAnnotations } = useAddMetadata();
  const { enqueueError } = useEnqueueError<DmError>();

  const popupState = usePopupState({ variant: 'popover', popupId: `add-label-${datasetId}` });

  return (
    <>
      <Tooltip title="Add a new label">
        <IconButton size="small" {...bindTrigger(popupState)}>
          <AddCircleOutlineRoundedIcon />
        </IconButton>
      </Tooltip>

      <Popover
        css={css`
          .MuiPopover-paper {
            padding: ${theme.spacing(1)}px;
          }
        `}
        {...bindPopover(popupState)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Formik
          validateOnMount
          initialValues={{ label: '', value: '' }}
          validationSchema={yup.object().shape({
            label: yup.string().trim().required('A label name is required'),
          })}
          onSubmit={async ({ label, value }) => {
            try {
              await addAnnotations({
                datasetId,
                data: {
                  labels: JSON.stringify([
                    {
                      type: 'LabelAnnotation',
                      label: label.trim().toLowerCase(),
                      value: value.trim(),
                      active: true,
                    },
                  ]),
                },
              });
              await queryClient.invalidateQueries(getGetDatasetsQueryKey());
            } catch (error) {
              enqueueError(error);
            } finally {
              popupState.close();
            }
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
                <Field autoFocus component={LowerCaseTextField} label="Name" name="label" />
                <Field component={TextField} label="Value" name="value" />
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
