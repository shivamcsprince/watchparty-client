/**
 * Socket.IO event contract with the watchparty-server.
 *
 * This file has no runtime exports by design — it documents the payload
 * shapes the client sends and receives. Read it alongside:
 *   - server: src/socket/handlers/RoomHandler.js
 *   - server: src/socket/handlers/PlaybackHandler.js
 *   - server: src/socket/handlers/ModerationHandler.js
 *   - server: src/socket/handlers/ChatHandler.js
 *   - server: scripts/room-demo.js (canonical usage example)
 *
 * CLIENT → SERVER (all use acks)
 *   join_room          { roomId: string }                -> JoinSnapshot
 *   leave_room         {}                                -> {}
 *   play               {}                                -> { playback }
 *   pause              {}                                -> { playback }
 *   seek               { time: number }                  -> { playback }
 *   change_video       { videoId: string }               -> { playback }
 *   request_sync       {}                                -> { playback }
 *   assign_role        { userId, role }                  -> { participants }
 *   remove_participant { userId }                        -> { participants }
 *   request_action     { action, time?, videoId? }       -> { request }
 *   resolve_request    { requestId, decision }           -> { requestId, status }
 *   list_requests      {}                                -> { requests }
 *   send_message       { text }                          -> { message }
 *   send_reaction      { emoji }                         -> { reaction }
 *
 * Ack failure shape: { ok: false, error: { code, message } }
 * Ack success shape: the payload described above (never `{ ok: true }`).
 *
 * SERVER → CLIENT (broadcasts, no ack)
 *   user_joined         { username, userId, role, participants }
 *   user_left           { username?, userId, participants }
 *   role_assigned       { userId, username?, role, participants }
 *   participant_removed { userId, participants }
 *   sync_state          { playback, participants? }
 *   session_replaced    { roomId }
 *   chat_message        { id, userId, username, role, text, sentAt }
 *   reaction            { id, userId, username, emoji, currentTime, sentAt }
 *   request_created     { request }
 *   request_resolved    { requestId, status }
 */
export {};