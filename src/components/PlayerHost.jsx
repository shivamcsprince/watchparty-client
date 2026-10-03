import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

let ytPromise = null;
function loadYouTubeApi() {
  if (ytPromise) return ytPromise;
  ytPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return ytPromise;
}

const PlayerHost = forwardRef(function PlayerHost(
  { videoId, onReady, onUserPlay, onUserPause, onUserSeek, onEnded },
  ref
) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const [ready, setReady] = useState(false);

  // 1. Create the player once — WITHOUT a video id.
  //    The load effect below is the only place that decides what to load.
  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then((YT) => {
      if (cancelled || playerRef.current) return;
      playerRef.current = new YT.Player(containerRef.current, {
        height: "100%",
        width: "100%",
        playerVars: {
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            setReady(true);
            onReady?.();
          },
          onError: (e) => {
            // 2 = invalid parameter, 5 = HTML5 player error, 100 = not found,
            // 101 / 150 = embedding disabled by owner.
            console.warn("[PlayerHost] YouTube error code:", e.data, "for video:", videoId);
          },
          onStateChange: (e) => {
            if (applyingRemoteRef.current) {
              if (e.data === YT_STATE.PLAYING || e.data === YT_STATE.PAUSED) {
                applyingRemoteRef.current = false;
              }
              return;
            }
            if (e.data === YT_STATE.PLAYING) onUserPlay?.();
            else if (e.data === YT_STATE.PAUSED) onUserPause?.();
            else if (e.data === YT_STATE.ENDED) onEnded?.();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      try { playerRef.current?.destroy?.(); } catch { /* noop */ }
      playerRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Load the requested video whenever it changes and the player is ready.
  useEffect(() => {
    if (!ready || !videoId || !playerRef.current) return;
    if (typeof videoId !== "string" || videoId.length !== 11) {
      console.warn("[PlayerHost] refusing to load invalid video id:", videoId);
      return;
    }
    console.log("[PlayerHost] loading video id:", videoId);
    applyingRemoteRef.current = true;
    playerRef.current.loadVideoById(videoId);
    setTimeout(() => {
      try { playerRef.current?.pauseVideo?.(); } catch { /* noop */ }
    }, 400);
  }, [videoId, ready]);

  useImperativeHandle(ref, () => ({
    play: () => {
      applyingRemoteRef.current = true;
      playerRef.current?.playVideo?.();
    },
    pause: () => {
      applyingRemoteRef.current = true;
      playerRef.current?.pauseVideo?.();
    },
    seek: (seconds) => {
      applyingRemoteRef.current = true;
      playerRef.current?.seekTo?.(seconds, true);
    },
    load: (id, startAt = 0) => {
      applyingRemoteRef.current = true;
      playerRef.current?.loadVideoById?.({ videoId: id, startSeconds: startAt });
    },
    getCurrentTime: () => playerRef.current?.getCurrentTime?.() ?? 0,
  }));

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
});

export default PlayerHost;