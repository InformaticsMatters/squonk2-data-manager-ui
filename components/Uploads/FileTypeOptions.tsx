import type { FC } from 'react';
import React from 'react';

import { useGetFileTypes } from '@squonk/data-manager-client/type';

import { Box, Card, CardContent, Grid, Typography } from '@material-ui/core';
import Form from '@rjsf/material-ui';

interface FileTypeOptionsProps {
  mimeTypes: string[];
  formDatas: any;
  onFormChange: (formData: any) => void;
  column?: boolean;
}

export const FileTypeOptions: FC<FileTypeOptionsProps> = ({
  mimeTypes,
  formDatas,
  onFormChange,
  column = false,
}) => {
  const { data, isLoading: isTypesLoading } = useGetFileTypes();
  const types = data?.types;

  if (!isTypesLoading && types) {
    const mimeTypesToShow = mimeTypes.filter(
      (mimeType) => !!types.find((type) => type.mime === mimeType)?.formatter_options,
    );
    return (
      <>
        {!!mimeTypesToShow.length && (
          <Box marginY={2}>
            <Typography component="h2" variant="h5">
              File Type Options
            </Typography>
            <Typography variant="subtitle1">
              If your selected files have extra options you can chose these below.
            </Typography>
          </Box>
        )}
        <Grid container spacing={4}>
          {mimeTypesToShow.map((mimeType) => {
            const type = types.find((type) => mimeType === type.mime);
            return (
              <Grid item key={mimeType} md={column ? 12 : 4} sm={column ? 12 : 6} xs={12}>
                <Card>
                  {type?.formatter_options ? (
                    <CardContent>
                      <Form
                        liveValidate
                        noHtml5Validate
                        formData={formDatas[mimeType]}
                        schema={type.formatter_options}
                        onChange={(event) =>
                          onFormChange({ ...formDatas, [mimeType]: event.formData })
                        }
                      >
                        <div />
                      </Form>
                    </CardContent>
                  ) : (
                    <CardContent>Unable to find schema for this type</CardContent>
                  )}
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </>
    );
  }

  return <Typography>Loading...</Typography>;
};
