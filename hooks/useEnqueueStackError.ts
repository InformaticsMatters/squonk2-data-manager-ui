import type { AxiosError } from 'axios';
import { useSnackbar } from 'notistack';

import { getErrorMessage } from '../utils/orvalError';

export const useEnqueueError = <TError>() => {
  const { enqueueSnackbar, ...rest } = useSnackbar();

  const enqueueError = (error: any) => {
    if ((error as AxiosError<TError>).isAxiosError) {
      // Axios errors propagate the API error
      enqueueSnackbar(getErrorMessage(error), { variant: 'error' });
    } else if (typeof error === 'string') {
      enqueueSnackbar(error, { variant: 'error' });
    } else {
      // Anything else
      enqueueSnackbar('An unknown error occurred', { variant: 'error' });
    }
  };

  return { enqueueSnackbar, ...rest, enqueueError };
};
