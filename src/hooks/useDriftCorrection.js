import { useEffect, useRef } from "react";

/**
 * Keeps the local player within `threshold` seconds of the server's idea of time.
 *
 * The server sends { currentTime, serverTime } — we assume the video kept
 * playing between the server's snapshot and now, so the expected position is
 *   expected = currentTime + (now - serverTime) / 1000
 * If |actual - expected| > threshold, we hard-seek.
 */
export function useDriftCorrection({
  playerRef,
  playState,
  serverTime,
  serverSentAt,
  threshold = 2,
  intervalMs = 1000,
}) {
  const lastRef = useRef({ serverTime, serverSentAt: Date.now(), playState });

  useEffect(() => {
    lastRef.current = {
      serverTime: serverTime ?? 0,
      serverSentAt: serverSentAt ?? Date.now(),
      playState,
    };
  }, [serverTime, serverSentAt, playState]);

  useEffect(() => {
    if (playState !== "playing") return;

    const id = setInterval(() => {
      const p = playerRef.current;
      if (!p) return;

      const { serverTime: st, serverSentAt: at } = lastRef.current;
      const expected = st + (Date.now() - at) / 1000;
      const actual = p.getCurrentTime();
      if (Math.abs(actual - expected) > threshold) {
        p.seek(expected);
      }
    }, intervalMs);

    return () => clearInterval(id);
  }, [playState, playerRef, threshold, intervalMs]);
}