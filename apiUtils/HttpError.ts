/**
 * Error with HTTP status to be sent with that error. Used in `handleApiErrors`.
 */
export abstract class HttpError extends Error {
  constructor(message: string, readonly status: number, readonly origin?: Error) {
    super(message);
  }
}

/**
 * A helper function to create `HttpError` classes
 */
const createErrorFactory = (status: number) => {
  class HttpErrorSubclass extends HttpError {
    constructor(message: string, origin?: Error) {
      super(message, status, origin);
    }
  }

  return HttpErrorSubclass;
};

export const BadRequestError = createErrorFactory(400);
export const InternalServerError = createErrorFactory(500);
