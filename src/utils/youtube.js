const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/**
 * Accepts a full YouTube URL (watch, youtu.be, /embed/, /shorts/) or a bare
 * 11-character video id. Returns the id, or null if it can't be parsed.
 */
export function extractVideoId(input) {
  if (!input) return null;
  const raw = String(input).trim();

  if (ID_RE.test(raw)) return raw;

  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1);
      return ID_RE.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = url.searchParams.get("v");
      if (v && ID_RE.test(v)) return v;

      const m = url.pathname.match(/^\/(?:embed|shorts|v)\/([A-Za-z0-9_-]{11})/);
      if (m) return m[1];
    }
  } catch {
    /* not a URL — fall through */
  }
  return null;
}

export function youtubeThumbUrl(videoId) {
  return `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
}