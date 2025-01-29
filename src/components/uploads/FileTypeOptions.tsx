import { useGetFileTypes } from "@squonk/data-manager-client/type";

import { Box, Grid2 as Grid, Typography } from "@mui/material";

import { CenterLoader } from "../CenterLoader";
import { MimeTypeCard, type MimeTypeCardProps } from "./MimeTypeCard";

export interface FileTypeOptionsProps
  extends Pick<MimeTypeCardProps, "formDatas" | "onFormChange"> {
  /**
   * The set of mime-types to display options for, if options are required
   */
  mimeTypes: string[];
  /**
   * Whether the forms should be displayed as a single column. Defaults to false.
   */
  column?: boolean;
}

/**
 * Displays generated forms for each mime-type card
 */
export const FileTypeOptions = ({
  mimeTypes,
  formDatas,
  onFormChange,
  column = false,
}: FileTypeOptionsProps) => {
  const { data, isLoading: isTypesLoading } = useGetFileTypes();
  const types = data?.types;

  if (!types || isTypesLoading) {
    return <CenterLoader />;
  }

  const mimeTypesToShow = mimeTypes.filter(
    (mimeType) => !!types.find((type) => type.mime === mimeType)?.formatter_options,
  );

  if (mimeTypesToShow.length === 0) {
    return null;
  }
  return (
    <>
      <Box sx={{ marginY: 2 }}>
        <Typography component="h2" variant="h5">
          File Type Options
        </Typography>
        <Typography variant="subtitle1">
          If your selected files have extra options you can chose these below.
        </Typography>
      </Box>
      <Grid container spacing={4}>
        {mimeTypesToShow.map((mimeType) => {
          const type = types.find((type) => mimeType === type.mime);
          return (
            <Grid key={mimeType} size={{ md: column ? 12 : 4, sm: column ? 12 : 6, xs: 12 }}>
              <MimeTypeCard formDatas={formDatas} type={type} onFormChange={onFormChange} />
            </Grid>
          );
        })}
      </Grid>
    </>
  );
};
