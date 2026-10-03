export const EV = {
  // client → server
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  PLAY: "play",
  PAUSE: "pause",
  SEEK: "seek",
  CHANGE_VIDEO: "change_video",
  REQUEST_SYNC: "request_sync",
  ASSIGN_ROLE: "assign_role",
  REMOVE_PARTICIPANT: "remove_participant",
  REQUEST_ACTION: "request_action",
  RESOLVE_REQUEST: "resolve_request",
  LIST_REQUESTS: "list_requests",
  SEND_MESSAGE: "send_message",
  SEND_REACTION: "send_reaction",

  // server → client
  USER_JOINED: "user_joined",
  USER_LEFT: "user_left",
  ROLE_ASSIGNED: "role_assigned",
  PARTICIPANT_REMOVED: "participant_removed",
  SYNC_STATE: "sync_state",
  SESSION_REPLACED: "session_replaced",
  CHAT_MESSAGE: "chat_message",
  REACTION: "reaction",
  REQUEST_CREATED: "request_created",
  REQUEST_RESOLVED: "request_resolved",
};