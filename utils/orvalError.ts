import type { AsError } from '@squonk/account-server-client';
import type { DmError } from '@squonk/data-manager-client';

import type { AxiosError } from 'axios';

/**
 *
 * @param error The Axios Error object from which to extract the human error message
 * @returns
 */
export const getErrorMessage = (
  error: AxiosError<void | DmError | AsError> | null | unknown,
): string | undefined => {
  const err = error as AxiosError<void | DmError | AsError> | null;
  if (err) {
    const e = err.response?.data as any;
    return e?.error || e?.detail;
  }
  return undefined;
};
