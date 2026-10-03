import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EV } from "../socket/events.js";
import { connectWithToken, getSocket, emitAck, disconnectSocket } from "../socket/socket.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { canChat, canControlPlayback, canModerateMembers, canRequest, canResolveRequests } from "../types/role.js";

/**
 * Owns everything that changes when the room changes:
 * participants, playback state, chat, reactions, requests.
 *
 * @param {string} roomCode   8-char code from the URL
 */
export function useRoom(roomCode) {
  const { token, user } = useAuth();

  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [you, setYou] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [playback, setPlayback] = useState({
    videoId: null,
    playState: "paused",
    currentTime: 0,
    serverTime: undefined,
  });
  const [messages, setMessages] = useState([]);
  const [reactions, setReactions] = useState([]);       // recent, ring buffer
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);
  const [sessionReplaced, setSessionReplaced] = useState(false);

  const socketRef = useRef(null);

  // Always-fresh reference to `you`. Handlers registered once inside the socket
  // effect would otherwise capture the initial (null) value forever.
  const youRef = useRef(null);
  useEffect(() => {
    youRef.current = you;
  }, [you]);

  const myRole = you?.role ?? null;
  const permissions = useMemo(
    () => ({
      canControl: canControlPlayback(myRole),
      canChat: canChat(myRole),
      canRequest: canRequest(myRole),
      canResolve: canResolveRequests(myRole),
      canModerate: canModerateMembers(myRole),
    }),
    [myRole]
  );

  // ---------- connect + subscribe ----------
  useEffect(() => {
    if (!token) return;
    const s = connectWithToken(token);
    socketRef.current = s;

    const onConnect = () => {
      setConnected(true);
      emitAck(s, EV.JOIN_ROOM, { roomId: roomCode }, (reply) => {
        if (!reply.ok) {
          setError(reply.error);
          return;
        }
        const snap = reply.data;
        setYou(snap.you);
        setParticipants(snap.participants ?? []);
        setPlayback(
          snap.playback ?? { videoId: null, playState: "paused", currentTime: 0 }
        );
        setMessages(snap.messages ?? []);
        setRequests(snap.requests ?? []);
        setJoined(true);
      });
    };

    const onDisconnect = () => {
      setConnected(false);
      setJoined(false);
    };

    const onSyncState = (p) => {
      setPlayback(p.playback ?? {});
      if (p.participants) setParticipants(p.participants);
    };

    const onUserJoined = (p) => {
      if (p.participants) setParticipants(p.participants);
    };

    const onUserLeft = (p) => {
      if (p.participants) setParticipants(p.participants);
    };

    const onRoleAssigned = (p) => {
      if (p.participants) setParticipants(p.participants);

      // The server sends the affected participant's *user* id (not the socket id).
      // We only care if this promotion/demotion is about us.
      const me = youRef.current;
      if (me && p.userId === me.userId) {
        const updated = (p.participants ?? []).find((x) => x.userId === me.userId);
        if (updated) {
          setYou((prev) => ({ ...prev, role: updated.role }));
        }
      }
    };

    const onParticipantRemoved = (p) => {
      if (p.participants) setParticipants(p.participants);
      const me = youRef.current;
      if (me && p.userId === me.userId) {
        setError("You were removed from the room by the host.");
        // We stay on the page but the server detaches us; a rejoin would fail.
      }
    };

    const onChatMessage = (m) => setMessages((prev) => [...prev, m]);
    const onReaction = (r) => setReactions((prev) => [...prev.slice(-49), r]);
    const onRequestCreated = (p) => setRequests((prev) => [...prev, p.request]);
    const onRequestResolved = (p) => {
      setRequests((prev) => prev.filter((r) => r.id !== p.requestId));
    };
    const onSessionReplaced = () => setSessionReplaced(true);

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on(EV.SYNC_STATE, onSyncState);
    s.on(EV.USER_JOINED, onUserJoined);
    s.on(EV.USER_LEFT, onUserLeft);
    s.on(EV.ROLE_ASSIGNED, onRoleAssigned);
    s.on(EV.PARTICIPANT_REMOVED, onParticipantRemoved);
    s.on(EV.CHAT_MESSAGE, onChatMessage);
    s.on(EV.REACTION, onReaction);
    s.on(EV.REQUEST_CREATED, onRequestCreated);
    s.on(EV.REQUEST_RESOLVED, onRequestResolved);
    s.on(EV.SESSION_REPLACED, onSessionReplaced);

    if (s.connected) onConnect();

    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off(EV.SYNC_STATE, onSyncState);
      s.off(EV.USER_JOINED, onUserJoined);
      s.off(EV.USER_LEFT, onUserLeft);
      s.off(EV.ROLE_ASSIGNED, onRoleAssigned);
      s.off(EV.PARTICIPANT_REMOVED, onParticipantRemoved);
      s.off(EV.CHAT_MESSAGE, onChatMessage);
      s.off(EV.REACTION, onReaction);
      s.off(EV.REQUEST_CREATED, onRequestCreated);
      s.off(EV.REQUEST_RESOLVED, onRequestResolved);
      s.off(EV.SESSION_REPLACED, onSessionReplaced);
      emitAck(s, EV.LEAVE_ROOM, {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, token]);

  // ---------- action helpers ----------
  const act = useCallback((event, payload) => {
    const s = socketRef.current;
    if (!s) return;
    emitAck(s, event, payload ?? {}, (reply) => {
      if (!reply.ok) setError(reply.error);
    });
  }, []);

  const play = useCallback(() => act(EV.PLAY, {}), [act]);
  const pause = useCallback(() => act(EV.PAUSE, {}), [act]);
  const seek = useCallback((time) => act(EV.SEEK, { time }), [act]);
  const changeVideo = useCallback((videoId) => act(EV.CHANGE_VIDEO, { videoId }), [act]);
  const requestSync = useCallback(() => act(EV.REQUEST_SYNC, {}), [act]);

  const sendMessage = useCallback((text) => act(EV.SEND_MESSAGE, { text }), [act]);
  const sendReaction = useCallback((emoji) => act(EV.SEND_REACTION, { emoji }), [act]);

  const assignRole = useCallback(
    (userId, role) => act(EV.ASSIGN_ROLE, { userId, role }),
    [act]
  );
  const removeParticipant = useCallback(
    (userId) => act(EV.REMOVE_PARTICIPANT, { userId }),
    [act]
  );

  const requestAction = useCallback(
    (action, extra = {}) => act(EV.REQUEST_ACTION, { action, ...extra }),
    [act]
  );
  const resolveRequest = useCallback(
    (requestId, decision) => act(EV.RESOLVE_REQUEST, { requestId, decision }),
    [act]
  );

  const clearError = useCallback(() => setError(null), []);

  const leave = useCallback(() => {
    const s = socketRef.current;
    if (s) emitAck(s, EV.LEAVE_ROOM, {});
    disconnectSocket();
  }, []);

  return {
    connected,
    joined,
    you,
    myRole,
    permissions,
    participants,
    playback,
    messages,
    reactions,
    requests,
    error,
    clearError,
    sessionReplaced,
    actions: {
      play,
      pause,
      seek,
      changeVideo,
      requestSync,
      sendMessage,
      sendReaction,
      assignRole,
      removeParticipant,
      requestAction,
      resolveRequest,
      leave,
    },
  };
}