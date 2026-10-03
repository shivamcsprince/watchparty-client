import { useEffect, useRef } from "react";
import { getSocket } from "./socket.js";

/**
 * Subscribe to a server → client event for the lifetime of the component.
 * The handler is stored in a ref so re-renders don't re-subscribe.
 *
 *   useSocketEvent(EV.SYNC_STATE, (payload) => { ... });
 */
export function useSocketEvent(event, handler) {
  const ref = useRef(handler);
  ref.current = handler;

  useEffect(() => {
    const s = getSocket();
    const wrapped = (...args) => ref.current?.(...args);
    s.on(event, wrapped);
    return () => {
      s.off(event, wrapped);
    };
  }, [event]);
}