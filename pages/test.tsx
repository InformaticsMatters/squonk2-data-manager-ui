import { Box } from "@mui/material";

import { SMILESInput } from "../components/SMILESInput";

// const SMILESInput = dynamic<any>(
//   () => import("../components/SMILESInput").then((mod) => mod.SMILESInput),
//   { ssr: false },
// );

export default () => {
  return (
    <Box width="700px">
      {/* eslint-disable-next-line @typescript-eslint/no-empty-function */}
      <SMILESInput value="C1C=CC=C1" onSave={(_smi) => {}} />
    </Box>
  );
};
