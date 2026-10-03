# Watch Party — Client

A React + Vite front end for the Watch Party app. Pairs with
[watchparty-server](../watchparty-server), which owns auth, rooms, WebSockets,
RBAC, and chat.

## Stack

- **React 19** + **Vite 8**
- **Material UI v9** (light/dark toggle)
- **React Router v7**
- **Socket.IO client** (WebSocket transport only)
- **Vitest** + **Testing Library** for unit tests
- **oxlint** for linting

## Local setup

```powershell
git clone <your-client-repo-url> watchparty-client
cd watchparty-client
npm install
```

Create `.env` at the repo root:

```
VITE_SERVER_URL=http://localhost:4000
```

Start the dev server:

```powershell
npm run dev
```

The app runs at http://localhost:5173. It expects the server on
`VITE_SERVER_URL` — start `watchparty-server` (`npm run dev` in that repo) in a
second terminal before you log in.

## Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Vite dev server with HMR on 5173      |
| `npm run build`   | Production build into `dist/`         |
| `npm run preview` | Serve `dist/` locally                 |
| `npm run lint`    | oxlint                                |
| `npm test`        | Vitest, one-shot                      |

## Routes

| Path              | Purpose                                       |
| ----------------- | --------------------------------------------- |
| `/login`          | Sign in (email + password)                    |
| `/register`       | Create account (username ≥ 3 chars)           |
| `/`               | Home: create a room, or join by code          |
| `/room/:roomId`   | The watch party itself                        |

## How it talks to the server

- **Auth over HTTP.** `POST /api/auth/register`, `POST /api/auth/login`,
  `GET /api/auth/me` — all in `src/api/auth.js`. The JWT is stored in
  `localStorage` and attached as `Authorization: Bearer <token>` on HTTP, and
  as `auth: { token }` on the Socket.IO handshake.
- **Real-time over WebSocket.** A single Socket.IO connection per tab. The
  `join_room` ack returns the full room snapshot (participants, playback,
  chat history, pending requests). Every subsequent change is a server
  broadcast. See `ARCHITECTURE.md` for the full event list.
- **One room per connection.** The server enforces this; opening a second tab
  with the same account replaces the first tab's session and shows a dialog.

## Permission model (mirrors server RBAC)

| Role        | Playback | Requests | Chat/Reactions | Assign roles | Remove | Resolve requests |
| ----------- | :------: | :------: | :------------: | :----------: | :----: | :--------------: |
| Host        |    ✅    |    —     |       ✅       |      ✅      |   ✅   |        ✅        |
| Moderator   |    ✅    |    —     |       ✅       |      —       |   —    |        ✅        |
| Participant |    —     |    ✅    |       ✅       |      —       |   —    |        —         |
| Viewer      |    —     |    —     |       —        |      —       |   —    |        —         |

The client hides or disables controls the current role can't use, but the
**server is the source of truth** — every action is validated server-side and
rejected with an ack error if the caller's role is insufficient. If you
disable JS in DevTools and click something anyway, the server still refuses.

## Folder layout

```
src/
├── api/           # HTTP: auth, rooms
├── auth/          # AuthProvider, RequireAuth, token storage
├── components/    # Player, controls, chat, participants, requests, role chip
├── hooks/         # useRoom, useDriftCorrection
├── pages/         # Login, Register, Home, Room
├── socket/        # Socket.IO client, event constants, subscribe helper
├── types/         # Role constants, shared shapes, permission helpers
└── utils/         # YouTube URL parsing, time formatting
```

## Deployment (Vercel — recommended for the client)

1. Push this repo to GitHub.
2. In Vercel → **New Project** → import the client repo.
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
4. Add environment variable:
   - `VITE_SERVER_URL` = your Render server URL, e.g.
     `https://watchparty-server.onrender.com`
5. Deploy. Vercel gives you a URL like
   `https://watchparty-client.vercel.app`.
6. Add that URL to the **server's** `CLIENT_ORIGIN` env var so CORS and
   Socket.IO allow the request.

**Live URL:** https://watchparty-client-ashy.vercel.app
**Backend:** https://usa-untitled-toddler-interactions.trycloudflare.com

## Known limits

- No media player for anything other than YouTube.
- Chat isn't persisted after the room empties (server keeps 50 in memory).
- Test videos must be embeddable. Many music videos are region-blocked for
  iframe embedding in India; the YT `onError` handler logs the code so you
  can pick an alternate (try `dQw4w9WgXcQ` or `jNQXAC9IVRw`).
- Drift correction tolerance is 2 seconds — deliberate, so brief buffer
  stutters don't cause jarring seeks.