import React, { FC, useState } from 'react';
import { useQueryClient } from 'react-query';

import { DatasetVersionDetail } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, useDeleteDataset } from '@squonk/data-manager-client/dataset';

import {
  FormControl,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  Tooltip,
  Typography,
} from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { Field, FieldArray } from 'formik';
import { CheckboxWithLabel } from 'formik-material-ui';
import * as yup from 'yup';

import { toLocalTimeString } from '../LocalTime/utils';
import { FormikModalWrapper } from '../Modals/FormikModalWrapper';

interface DeleteDatasetProps {
  datasetId: string;
  versions: DatasetVersionDetail[];
}

export const DeleteDataset: FC<DeleteDatasetProps> = ({ datasetId, versions }) => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteDataset();

  const initialVersionsValues = versions.map((version) => version.processing_stage === 'DONE');

  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip arrow title="Delete versions of this dataset">
        <IconButton aria-label="Delete selected dataset" size="small" onClick={() => setOpen(true)}>
          <DeleteForeverIcon />
        </IconButton>
      </Tooltip>
      <FormikModalWrapper
        enableReinitialize
        validateOnMount
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
        id={`delete-dataset-${datasetId}`}
        initialValues={{ versions: initialVersionsValues }}
        open={open}
        submitText="Delete"
        title="Delete Dataset Versions"
        validationSchema={yup.object().shape({
          versions: yup
            .array()
            .of(yup.bool())
            .test(
              'at-least-one-selected',
              'At least one version must be selected',
              (values) => !!values?.some((v) => v),
            ),
        })}
        onClose={() => setOpen(false)}
        onSubmit={async (values, { setSubmitting }) => {
          // Get the version objects that are to be deleted
          const versionsToDelete = versions.filter(
            (_, versionIndex) => values.versions[versionIndex],
          );
          // Delete them in parallel
          const requests = versionsToDelete.map((version) =>
            deleteMutation.mutateAsync({ datasetid: datasetId, datasetversion: version.version }),
          );

          // When all are done, update the datasets table
          await Promise.all(requests);
          queryClient.invalidateQueries(getGetDatasetsQueryKey());
          setSubmitting(false);
          setOpen(false);
        }}
      >
        {({ values, errors }) => {
          return (
            <>
              <Typography gutterBottom variant="body2">
                Select versions of datasets to delete. Selecting all versions will delete the entire
                dataset record.
              </Typography>
              <FieldArray name="versions">
                {() => (
                  <FormControl component="fieldset" error={!!errors.versions}>
                    <FormLabel component="legend">Select Versions to Delete</FormLabel>
                    <FormGroup row>
                      {values.versions.map((version, versionIndex) => (
                        <Field
                          checked={version}
                          component={CheckboxWithLabel}
                          disabled={versions[versionIndex].processing_stage !== 'DONE'}
                          key={versionIndex}
                          Label={{
                            label: `v${versions[versionIndex].version} - ${toLocalTimeString(
                              versions[versionIndex].published,
                              true,
                              true,
                            )} - ${versions[versionIndex].processing_stage}`,
                          }}
                          name={`versions.${versionIndex}`}
                          type="checkbox"
                        />
                      ))}
                    </FormGroup>
                    {!!errors.versions && <FormHelperText>{errors.versions}</FormHelperText>}
                  </FormControl>
                )}
              </FieldArray>
            </>
          );
        }}
      </FormikModalWrapper>
    </>
  );
};
