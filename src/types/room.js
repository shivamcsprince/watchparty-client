// Payload shapes are documented here; there is nothing to import at runtime.
// The actual shapes come from the server (see room-demo.js and RoomHandler.js).

export const PLAY_STATES = Object.freeze({
  PLAYING: "playing",
  PAUSED: "paused",
});

export const REQUEST_ACTIONS = Object.freeze({
  PLAY: "play",
  PAUSE: "pause",
  SEEK: "seek",
  CHANGE_VIDEO: "change_video",
});

/** The 8 emoji the server accepts (see reactionSchema on the server). */
export const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "👏", "🔥", "🎉"];

/** Chat is 1–500 chars per the server's chatSchema. */
export const CHAT_MAX_LENGTH = 500;

/** Room codes are 8 characters (see roomCodeSchema). */
export const ROOM_CODE_LENGTH = 8;

export function isValidRoomCode(code) {
  return typeof code === "string" && code.length === ROOM_CODE_LENGTH;
}