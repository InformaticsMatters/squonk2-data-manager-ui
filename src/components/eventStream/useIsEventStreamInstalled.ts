import { EventStreamVersionGetResponseProtocol } from "@squonk/account-server-client";
import { useGetEventStreamVersion } from "@squonk/account-server-client/event-stream";

export const useIsEventStreamInstalled = () => {
  const { data: protocol } = useGetEventStreamVersion({
    query: { select: (data) => data.protocol },
  });
  return protocol === EventStreamVersionGetResponseProtocol.WEBSOCKET;
};
