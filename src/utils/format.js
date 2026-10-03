/** 3.7 -> "0:03", 75.2 -> "1:15", 3725 -> "1:02:05" */
export function formatTime(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/** ISO string -> "10:58 AM" (locale dependent). */
export function formatClock(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Turn a server error code (or ack error) into a sentence fit for a Snackbar. */
export function humanizeError(err) {
  if (!err) return "Something went wrong.";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  if (err.error?.message) return err.error.message;
  return "Something went wrong.";
}