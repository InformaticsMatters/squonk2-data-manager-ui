import type { TypeSummary } from '@squonk/data-manager-client';

import { Card, CardContent } from '@mui/material';
import Form from '@rjsf/material-ui/v5';

export interface MimeTypeCardProps {
  /**
   * The type summary containing the form schema
   */
  type?: TypeSummary;
  /**
   * The value of the mime-type forms
   */
  formDatas: any;
  /**
   * Called when one of the generated forms is changed
   */
  onFormChange: (formData: any) => void;
}

/**
 * A card with the form generated for a given mime-type
 */
export const MimeTypeCard = ({ type, formDatas, onFormChange }: MimeTypeCardProps) => {
  return (
    <Card elevation={2}>
      {type?.formatter_options ? (
        <CardContent>
          <Form
            liveValidate
            noHtml5Validate
            formData={formDatas[type.mime]}
            schema={type.formatter_options}
            onChange={(event) => onFormChange({ ...formDatas, [type.mime]: event.formData })}
          >
            {/* Disable the default submit button */}
            <div />
          </Form>
        </CardContent>
      ) : (
        <CardContent>Unable to find schema for this type</CardContent>
      )}
    </Card>
  );
};
