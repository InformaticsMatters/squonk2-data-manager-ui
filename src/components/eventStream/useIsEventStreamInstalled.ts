import { EventStreamVersionGetResponseProtocol } from "@/api/account-server";
import { useGetEventStreamVersion } from "@/api/account-server/event-stream";

export const useIsEventStreamInstalled = () => {
  const { data: protocol } = useGetEventStreamVersion({
    query: { select: (data) => data.protocol },
  });
  return protocol === EventStreamVersionGetResponseProtocol.WEBSOCKET;
};
