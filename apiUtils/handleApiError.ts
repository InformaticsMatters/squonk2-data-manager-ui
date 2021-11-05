import type { NextApiResponse } from 'next';

import { HttpError } from './HttpError';

/**
 * Helper function to handle errors which occurred in processing of API request. The shape of the
 * error response is kept the same as the errors returned from data-manager API.
 * TODO: Possibly make this as a middleware so we don't have to manually try/catch and call it in
 * the catch block?
 */
export const handleApiError = (res: NextApiResponse, error: unknown) => {
  if (error instanceof HttpError) {
    if (error.origin) {
      console.error(error.message);
      console.error(error.origin);
    } else {
      console.error(error);
    }

    return res.status(error.status).json({ error: error.message });
  }

  console.error(error);

  if (error instanceof Error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(500).json({ error: String(error) });
};
