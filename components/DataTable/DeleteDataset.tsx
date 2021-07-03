import React, { FC, useState } from 'react';

import { Field, FieldArray } from 'formik';
import { CheckboxWithLabel } from 'formik-material-ui';
import { useQueryClient } from 'react-query';
import * as yup from 'yup';

import {
  FormControl,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  Tooltip,
} from '@material-ui/core';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import { DatasetVersionDetail } from '@squonk/data-manager-client';
import { getGetDatasetsQueryKey, useDeleteDataset } from '@squonk/data-manager-client/dataset';

import { FormikModalWrapper } from '../FormikModalWrapper';

interface DeleteDatasetProps {
  datasetId: string;
  versions: DatasetVersionDetail[];
}

export const DeleteDataset: FC<DeleteDatasetProps> = ({ datasetId, versions }) => {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteDataset();

  const initialVersionsValues = Array.from({ length: versions.length }).fill(false) as boolean[];

  const [open, setOpen] = useState(false);
  return (
    <>
      <FormikModalWrapper
        DialogProps={{ maxWidth: 'sm', fullWidth: true }}
        title="Delete Dataset Versions"
        submitText="Delete"
        open={open}
        onClose={() => setOpen(false)}
        initialValues={{ versions: initialVersionsValues }}
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
        }}
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
      >
        {({ values, errors }) => {
          return (
            <FieldArray name="versions">
              {() => (
                <FormControl component="fieldset" error={!!errors.versions}>
                  <FormLabel component="legend">Select Versions to Delete</FormLabel>
                  <FormGroup row>
                    {values.versions.map((version, versionIndex) => (
                      <Field
                        key={version}
                        type="checkbox"
                        component={CheckboxWithLabel}
                        name={`versions.${versionIndex}`}
                        checked={version}
                        Label={{ label: versions[versionIndex].version }}
                      />
                    ))}
                  </FormGroup>
                  {!!errors.versions && <FormHelperText>{errors.versions}</FormHelperText>}
                </FormControl>
              )}
            </FieldArray>
          );
        }}
      </FormikModalWrapper>
      <Tooltip arrow title="Delete selected dataset">
        <IconButton size="small" aria-label="Delete selected dataset" onClick={() => setOpen(true)}>
          <DeleteForeverIcon />
        </IconButton>
      </Tooltip>
    </>
  );
};
