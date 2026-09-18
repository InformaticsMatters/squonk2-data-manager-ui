const WebSocketCloseCode = {
  NORMAL: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS: 1005,
  ABNORMAL: 1006,
  INVALID_PAYLOAD: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  CLIENT_TERMINATED: 1010,
  SERVER_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE_FAIL: 1015,
  POLICY_UNAUTHORIZED: 4401,
  POLICY_FORBIDDEN: 4403,
} as const;

type WebSocketCloseCodeValue = (typeof WebSocketCloseCode)[keyof typeof WebSocketCloseCode];

const closeCodeDescriptions: Record<WebSocketCloseCodeValue, string> = {
  [WebSocketCloseCode.NORMAL]: "Normal closure - connection completed successfully",
  [WebSocketCloseCode.GOING_AWAY]: "Going away - server is shutting down or client navigating away",
  [WebSocketCloseCode.PROTOCOL_ERROR]: "Protocol error - invalid data received",
  [WebSocketCloseCode.UNSUPPORTED_DATA]: "Unsupported data - received data type not supported",
  [WebSocketCloseCode.NO_STATUS]: "No status received - no close code provided",
  [WebSocketCloseCode.ABNORMAL]: "Abnormal closure - connection lost without close frame",
  [WebSocketCloseCode.INVALID_PAYLOAD]: "Invalid frame payload data - received inconsistent data",
  [WebSocketCloseCode.POLICY_VIOLATION]: "Policy violation - message violates server policy",
  [WebSocketCloseCode.MESSAGE_TOO_BIG]: "Message too big - message exceeds size limit",
  [WebSocketCloseCode.CLIENT_TERMINATED]: "Client error - client terminated connection",
  [WebSocketCloseCode.SERVER_ERROR]: "Server error - server encountered error",
  [WebSocketCloseCode.SERVICE_RESTART]: "Service restart - server restarting",
  [WebSocketCloseCode.TRY_AGAIN_LATER]: "Try again later - temporary server condition",
  [WebSocketCloseCode.BAD_GATEWAY]: "Bad gateway - invalid response from upstream",
  [WebSocketCloseCode.TLS_HANDSHAKE_FAIL]: "TLS handshake - TLS handshake failed",
  [WebSocketCloseCode.POLICY_UNAUTHORIZED]: "Policy violation - unauthorized",
  [WebSocketCloseCode.POLICY_FORBIDDEN]: "Policy violation - forbidden",
};

/** The same table, read by a close code that may be any number the protocol allows. */
const describedCloseCodes: Partial<Record<number, string>> = closeCodeDescriptions;

/**
 * What a close code says in words, or `null` for a code this table does not cover. The codes are
 * the protocol's own and the wording is this application's, so the same reason reaches the console
 * and the caller rather than one being written for each.
 */
export const describeCloseCode = (code: number): string | null => describedCloseCodes[code] ?? null;

/**
 * The whole sentence a closed event stream is reported with.
 *
 * The close carries a reason the client already holds words for, so it states that reason rather
 * than only the fact of the disconnection; a code the table does not cover leaves the generic
 * sentence standing alone, which is the one case where there is nothing more to say. What happens
 * next is the client's own to state, so it comes last and only where a reconnection follows.
 */
export const eventStreamCloseMessage = ({
  code,
  wasClean,
}: Pick<CloseEvent, "code" | "wasClean">): string => {
  // A normal closure has nothing to add: it says the stream ended, which the sentence in front of
  // it has just said. Every other code says something that sentence does not carry.
  const description = code === WebSocketCloseCode.NORMAL ? null : describeCloseCode(code);

  return [
    wasClean ? "Disconnected from event stream." : "Event stream disconnected unexpectedly.",
    description === null ? null : `${description}.`,
    wasClean ? null : "Attempting to reconnect...",
  ]
    .filter((sentence) => sentence !== null)
    .join(" ");
};
