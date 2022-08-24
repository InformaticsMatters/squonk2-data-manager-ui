import { useQueryClient } from "react-query";

import { getGetInstanceQueryKey } from "@squonk/data-manager-client/instance";

import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { Box, Container, IconButton, Tooltip } from "@mui/material";
import NextError from "next/error";
import { useRouter } from "next/router";

import { EventDebugSwitch } from "../../../components/EventDebugSwitch";
import Layout from "../../../components/Layout";
import { AllResultsButton } from "../../../components/results/AllResultsButton";
import { Instance } from "../../../components/results/Instance";
import { InstanceTitle } from "../../../components/results/InstanceTitle";
import { RoleRequired } from "../../../utils/RoleRequired";

const Result = () => {
  const queryClient = useQueryClient();

  const router = useRouter();
  const { instanceId } = router.query;

  if (typeof instanceId !== "string") {
    return <NextError statusCode={400} statusMessage="Instance ID is invalid" />;
  }

  const refreshResults = [() => queryClient.invalidateQueries(getGetInstanceQueryKey(instanceId))];

  return (
    <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(" ")}>
      <Layout>
        <Container maxWidth="md">
          <Box alignItems="flex-start" display="flex">
            <EventDebugSwitch />
            <Tooltip title="Refresh Instance">
              <IconButton
                size="large"
                sx={{ ml: "auto" }}
                onClick={() => refreshResults.forEach((func) => func())}
              >
                <RefreshRoundedIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {instanceId && <InstanceTitle instanceId={instanceId} />}

          <Instance collapsedByDefault={false} instanceId={instanceId} />
          <AllResultsButton instanceId={instanceId} />
        </Container>
      </Layout>
    </RoleRequired>
  );
};

export default withPageAuthRequired(Result);
