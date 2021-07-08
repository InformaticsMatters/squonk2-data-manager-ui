import React, { FC } from 'react';

import { Box, Card, CardContent, Grid, Typography } from '@material-ui/core';
import Form from '@rjsf/material-ui';
import { useGetFileTypes } from '@squonk/data-manager-client/type';

interface FileTypeOptionsProps {
  mimeTypes: string[];
  formDatas: any;
  onFormChange: (formData: any) => void;
}

export const FileTypeOptions: FC<FileTypeOptionsProps> = ({
  mimeTypes,
  formDatas,
  onFormChange,
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
            <Typography variant="h5" component="h2">
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
              <Grid key={mimeType} item xs={12} sm={6} md={4}>
                <Card>
                  {type?.formatter_options ? (
                    <CardContent>
                      <Form
                        liveValidate
                        noHtml5Validate
                        schema={type.formatter_options}
                        formData={formDatas[mimeType]}
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
