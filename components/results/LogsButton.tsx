import type { InstanceSummary } from '@squonk/data-manager-client';

import { Button } from '@material-ui/core';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { APP_ROUTES } from '../../constants/routes';

export interface LogsButtonProps {
  instance: InstanceSummary;
}

export const LogsButton = ({ instance }: LogsButtonProps) => {
  const { query } = useRouter();
  return (
    <Link
      passHref
      href={{
        pathname: APP_ROUTES.project['.'],
        query: {
          ...query,
          project: instance.project_id,
          path: `.${instance.id}`,
        },
      }}
    >
      <Button>Logs</Button>
    </Link>
  );
};
