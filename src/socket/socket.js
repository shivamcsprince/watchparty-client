import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SERVER_URL;

if (!URL) {
  // Fail loudly instead of silently connecting to the wrong origin.
  // Fix by creating watchparty-client/.env with VITE_SERVER_URL=...
  console.error("[socket] VITE_SERVER_URL is not set. Check your .env file.");
}

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(URL, {
      autoConnect: false,
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
  }
  return socket;
}

export function connectWithToken(token) {
  const s = getSocket();
  s.auth = { token };
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
  socket = null;
}

/**
 * Every emit on this server uses an ack. This helper wraps the pattern:
 *   emitAck(socket, EV.PLAY, {}, (reply) => {...})
 * It normalizes the two reply shapes we see on the server:
 *   success -> payload directly (e.g. { playback })
 *   failure -> { ok: false, error: { code, message } }
 */
export function emitAck(socket, event, payload, onReply) {
  socket.emit(event, payload ?? {}, (reply) => {
    if (!onReply) return;
    if (reply && reply.ok === false) {
      const msg = reply.error?.message ?? "Request failed";
      onReply({ ok: false, error: msg, code: reply.error?.code });
    } else {
      onReply({ ok: true, data: reply });
    }
  });
}