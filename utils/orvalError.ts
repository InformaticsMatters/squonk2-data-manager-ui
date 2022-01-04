import type { AsError } from '@squonk/account-server-client';
import type { DmError } from '@squonk/data-manager-client';

import type { AxiosError } from 'axios';

/**
 *
 * @param error The Axios Error object from which to extract the human error message
 * @returns
 */
export const getErrorMessage = (
  error: AxiosError<void | DmError | AsError> | null,
): string | undefined => {
  if (error) {
    return (error.response?.data as any).detail;
  }
  return undefined;
};
