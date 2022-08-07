import type { ServerResponse } from "node:http";

export const createErrorProps = (res: ServerResponse, code: number, message: string) => {
  const statusCode = code;
  const statusMessage = message;
  res.statusCode = statusCode;
  res.statusMessage = statusMessage;
  return { props: { statusCode, statusMessage } };
};
