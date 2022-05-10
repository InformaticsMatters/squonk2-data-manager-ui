import { useQueryClient } from 'react-query';

import { getGetTaskQueryKey, useGetTask } from '@squonk/data-manager-client/task';

import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Alert, Box, Container, IconButton, Tooltip, Typography } from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { CenterLoader } from '../../../components/CenterLoader';
import Layout from '../../../components/Layout';
import { ResultTaskCard } from '../../../components/results/ResultTaskCard';
import { getErrorMessage } from '../../../utils/orvalError';
import { RoleRequired } from '../../../utils/RoleRequired';

const Result = () => {
  const queryClient = useQueryClient();

  const router = useRouter();

  const taskId = router.query.taskId as string;

  const { data: task, isLoading, isError, error } = useGetTask(taskId);

  const refreshResults = [() => queryClient.invalidateQueries(getGetTaskQueryKey(taskId))];

  return (
    <>
      <Head>
        <title>Squonk | Task {task?.states?.slice(-1)[0]?.state}</title>
      </Head>
      <RoleRequired roles={process.env.NEXT_PUBLIC_KEYCLOAK_USER_ROLE?.split(' ')}>
        <Layout>
          <Container maxWidth="md">
            <Box alignItems="flex-start" display="flex">
              <Typography gutterBottom component="h1" variant="h3">
                Task
              </Typography>
              <Tooltip title="Refresh Instance">
                <IconButton
                  size="large"
                  sx={{ ml: 'auto' }}
                  onClick={() => refreshResults.forEach((func) => func())}
                >
                  <RefreshRoundedIcon />
                </IconButton>
              </Tooltip>
            </Box>
            {isError ? (
              <Alert severity="error">{getErrorMessage(error)}</Alert>
            ) : isLoading || task === undefined ? (
              <CenterLoader />
            ) : (
              <ResultTaskCard poll collapsedByDefault={false} task={{ ...task, id: taskId }} />
            )}
          </Container>
        </Layout>
      </RoleRequired>
    </>
  );
};

export default withPageAuthRequired(Result);
