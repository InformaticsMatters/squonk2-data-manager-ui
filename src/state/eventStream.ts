import { ReadyState } from "react-use-websocket";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { atom, useAtom } from "jotai";

import { type ChargeMessage } from "../protobuf/protobuf";

dayjs.extend(utc);

/**
 * Atom to store all events
 */
export const eventsAtom = atom<ChargeMessage[]>([]);

/**
 * Atom to track when the user's session started
 */
export const sessionStartTimeAtom = atom<dayjs.Dayjs | null>(null);

/**
 * Atom to track WebSocket connection status
 */
export const webSocketStatusAtom = atom<ReadyState>(ReadyState.CLOSED);

/**
 * Utility function to derive boolean status flags from ReadyState
 */
export const getWebSocketStatusFlags = (readyState: ReadyState) => ({
  isConnected: readyState === ReadyState.OPEN,
  isConnecting: readyState === ReadyState.CONNECTING,
  isDisconnected: readyState === ReadyState.CLOSED,
  isReconnecting: readyState === ReadyState.CLOSING,
});

/**
 * Hook to manage events with deduplication and sorting
 */
export const useEventStream = () => {
  const [events, setEvents] = useAtom(eventsAtom);
  const [sessionStartTime, setSessionStartTime] = useAtom(sessionStartTimeAtom);

  const addEvent = (event: ChargeMessage) => {
    const eventId = `${event.timestamp}-${event.ordinal}`;
    const existingEventIds = events.map((e) => `${e.timestamp}-${e.ordinal}`);

    if (existingEventIds.includes(eventId)) {
      return false;
    }

    const newEvents = [...events, event]
      .toSorted((a, b) => dayjs.utc(b.timestamp).valueOf() - dayjs.utc(a.timestamp).valueOf())
      .slice(-100); // Keep last 100 events

    setEvents(newEvents);
    return true;
  };

  const isEventNewerThanSession = (event: ChargeMessage) => {
    if (!sessionStartTime) {
      return false;
    }
    return dayjs.utc(event.timestamp).isAfter(sessionStartTime);
  };

  const initializeSession = () => {
    if (!sessionStartTime) {
      setSessionStartTime(dayjs.utc());
    }
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return {
    events,
    addEvent,
    isEventNewerThanSession,
    initializeSession,
    clearEvents,
    sessionStartTime,
  };
};

/**
 * Atom to control event stream enablement
 */
export const eventStreamEnabledAtom = atom(true);
