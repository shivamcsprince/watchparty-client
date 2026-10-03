# Architecture

## System diagram

```
   ┌────────────────────┐   HTTPS (auth, room create)   ┌────────────────────┐
   │                    │ ───────────────────────────▶  │                    │
   │  Browser (React)   │                               │  Node/Express      │
   │                    │   WSS (socket.io)             │  + Socket.IO       │
   │  Vite + MUI        │ ◀───────────────────────────▶ │  watchparty-server │
   │                    │   JWT in handshake.auth       │                    │
   └────────────────────┘                               └─────────┬──────────┘
                                                                  │
                                                                  ▼
                                                          ┌───────────────┐
                                                          │  PostgreSQL   │
                                                          │  (Neon)       │
                                                          │  users, rooms │
                                                          └───────────────┘
```

- **HTTP** is used for one-shot operations: register, login, verify session,
  create room. These don't need to be real-time.
- **WebSocket (Socket.IO)** carries everything that must be felt immediately:
  join, leave, playback control, role changes, chat, reactions, requests.
- **Postgres** persists users and rooms so accounts survive restarts. The
  in-memory room state (participants, playback, chat) is intentionally
  ephemeral — when the last person leaves, the room is discarded.

## WebSocket integration — step by step

### 1. Connecting

The client reads the JWT from `localStorage` and connects with:

```js
io(serverUrl, { auth: { token }, transports: ["websocket"] })
```

On the server, `authenticateSocket` runs once per connection. It verifies the
token and attaches `{ userId, username }` to `socket.data`. If the token is
missing or invalid, the connection is rejected — before any room logic runs.

**Why this matters:** the client never sends "I am the host" or "my role is
moderator." The role is looked up from the room state, keyed by the verified
`userId`. A malicious client can't promote itself.

### 2. Joining a room

```
Client                            Server
  │                                 │
  │── join_room { roomId } ───────▶│  1. validate payload (zod)
  │                                 │  2. find or reject the room
  │                                 │  3. add participant (or replace existing socket)
  │                                 │  4. socket.join(room channel)
  │                                 │  5. broadcast user_joined to others
  │◀── ack { snapshot } ───────────│
  │                                 │
```

The ack returns the **full snapshot**: `you`, `participants`, `playback`,
`messages` (last 50), `requests`. This is what makes late joiners work —
they don't need to replay history, they receive the current state directly.

### 3. Playback control

```
Host                        Server                       Everyone
  │                            │                              │
  │── play / seek / change ───▶│                              │
  │                            │ 1. RolePolicy.can(role, PLAYBACK_CONTROL)
  │                            │ 2. PlaybackState.play() / seek() / changeVideo()
  │                            │ 3. snapshot() the new state
  │                            │                              │
  │                            │── broadcast sync_state ─────▶│
  │◀── ack { playback } ───────│                              │
  │                            │                              │
  │                            │                              │ apply to YT player
```

`PlaybackState` never stores "the current time." It stores `position` (the
position at the moment of the last change) plus `updatedAt`. `snapshot()`
computes:

```
currentTime = position + (now − updatedAt) / 1000    [only if playing]
```

This means a late joiner, or a client whose tab was backgrounded, gets the
*correct* position, not a stale one. The client extrapolates the same way
between server updates and hard-seeks if the drift exceeds 2 seconds.

### 4. Role assignment

```
Host                       Server                    Affected user + everyone
  │                           │                              │
  │── assign_role ───────────▶│                              │
  │     { userId, role }      │ 1. RolePolicy.can(actorRole, ASSIGN_ROLE)
  │                           │ 2. RoomModeration.assignRole()
  │                           │ 3. build updated participants list
  │                           │                              │
  │                           │── broadcast role_assigned ──▶│
  │◀── ack { participants } ──│                              │
  │                           │                              │
  │                           │                              │ if userId === me:
  │                           │                              │   setYou({ role })
  │                           │                              │   permissions recompute
```

### 5. Request / approval flow

The PDF's functional requirements say a participant must "request admin/mod
to approve any changes." The server models this with `RequestQueue`:

```
Participant                  Server                      Host / Moderator
  │                            │                              │
  │── request_action ─────────▶│                              │
  │     { action: "pause" }    │ 1. RolePolicy.can(role, REQUEST_ACTION)
  │                            │ 2. create Request, queue it
  │                            │                              │
  │                            │── broadcast request_created ▶│
  │◀── ack { request } ────────│                              │
  │                            │                              │
  │                            │◀── resolve_request ──────────│
  │                            │     { requestId, "approve" } │
  │                            │ 3. apply the action server-side
  │                            │ 4. broadcast sync_state + request_resolved
  │                            │                              │
  │◀────────── sync_state ─────│                              │
```

The approval triggers the actual playback change on the server. The
participant doesn't need to emit anything after approval — they just wait
for the `sync_state` broadcast, same as everyone else.

### 6. Disconnects and session replacement

- **Explicit leave** (`leave_room`) or socket disconnect → `RoomManager.leave()`
  removes the participant, broadcasts `user_left`, and either promotes
  someone or waits for a grace period if the leaver was the host.
- **Same user, second tab** → the server detaches the older socket and emits
  `session_replaced` to it. The client shows a dialog and doesn't try to
  rejoin. This prevents "which tab is the host" confusion.
- **Host leaves** → `RoomManager` promotes another participant so the room
  isn't abandoned.

## Role enforcement: defense in depth

Three independent checks:

1. **Client hides the button.** `PlaybackControls` uses
   `permissions.canControl` to decide whether to show play/pause or the
   "request" alternative.
2. **Server checks the role.** `PlaybackHandler.#control()` calls
   `RolePolicy.can(participant.role, ACTIONS.PLAYBACK_CONTROL)` and throws
   `AppError(403)` if the role isn't allowed.
3. **Server derives the role from `socket.data.user.userId`**, never from the
   payload. A client that forges `{ role: "host" }` in a `play` event is
   ignored — the server looks up the real role from room state.

Layer 3 is the one that actually matters for security. Layers 1 and 2 exist
for UX and defense against accidents.

## Why these trade-offs

- **Socket.IO, not raw `ws`.** Socket.IO gives us rooms, reconnection, and
  acks out of the box. The overhead is a small framing layer; the payoff is
  one fewer custom protocol to build and debug.
- **In-memory room state.** Rooms are transient. Persisting them would mean
  migrations, cleanup jobs, and stale rooms hanging around forever. For this
  assignment's scope, in-memory is the right call. If we needed persistence,
  a `rooms` table plus a "last activity" column would be the next step.
- **2-second drift threshold.** Tighter (500 ms) causes the player to seek
  every time a client buffers for a moment, which is jarring. Looser (5 s)
  lets audio drift noticeably out of sync. 2 s is the sweet spot for
  human-perceptible A/V sync.
- **Single server instance.** Socket.IO's in-memory rooms don't span multiple
  Node processes. Horizontal scaling would require the Redis adapter. Not
  needed for the assignment — the PDF lists it as a bonus idea.