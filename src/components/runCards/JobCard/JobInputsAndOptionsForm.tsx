import { type Dispatch, type RefObject, type SetStateAction } from "react";

import { type JobOrderDetail } from "@squonk/data-manager-client";

import { Grid2 as Grid, Typography } from "@mui/material";
import { Form } from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";

import { JobInputFields } from "./JobInputFields";
import { type InputData } from "./JobModal";

interface JobInputsAndOptionsFormProps {
  inputs?: any;
  options?: any;
  order: JobOrderDetail["options"];
  projectId: string;
  inputsData: InputData;
  setInputsData: Dispatch<SetStateAction<InputData>>;
  optionsFormData: any;
  setOptionsFormData: Dispatch<SetStateAction<any>>;
  formRef: RefObject<any>;
  specVariables?: any;
}

export const JobInputsAndOptionsForm = ({
  inputs,
  options,
  order,
  projectId,
  inputsData,
  setInputsData,
  optionsFormData,
  setOptionsFormData,
  formRef,
  specVariables,
}: JobInputsAndOptionsFormProps) => {
  return (
    <Grid container spacing={2}>
      <>
        {!!inputs && (
          <>
            <Grid size={{ xs: 12 }}>
              <Typography component="h3" sx={{ fontWeight: "bold" }} variant="subtitle1">
                Inputs
              </Typography>
            </Grid>
            <JobInputFields
              initialValues={specVariables}
              inputs={inputs}
              inputsData={inputsData}
              projectId={projectId}
              onChange={setInputsData}
            />
          </>
        )}
      </>
      <Grid size={{ xs: 12 }}>
        {!!options && (
          <>
            <Typography component="h3" sx={{ fontWeight: "bold" }} variant="subtitle1">
              Options
            </Typography>
            <Form
              liveValidate
              noHtml5Validate
              formData={optionsFormData}
              ref={formRef}
              schema={options}
              showErrorList="bottom"
              uiSchema={{ "ui:order": order }}
              validator={validator}
              onChange={(event) => setOptionsFormData(event.formData)}
              onError={() => {}}
            >
              {/* Remove the default submit button */}
              <div />
            </Form>
          </>
        )}
      </Grid>
    </Grid>
  );
};
