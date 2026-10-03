import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert, AppBar, Box, Button, Chip, Container, Dialog, DialogActions,
  DialogContent, DialogContentText, DialogTitle, IconButton, Paper,
  Snackbar, Stack, Toolbar, Tooltip, Typography,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import LogoutIcon from "@mui/icons-material/Logout";

import PlayerHost from "../components/PlayerHost.jsx";
import PlaybackControls from "../components/PlaybackControls.jsx";
import ParticipantsList from "../components/ParticipantsList.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import RequestsPanel from "../components/RequestsPanel.jsx";

import { useRoom } from "../hooks/useRoom.js";
import { useDriftCorrection } from "../hooks/useDriftCorrection.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Room() {
  const params = useParams();
  const roomId = params.roomId ?? "";
  const navigate = useNavigate();
  const { user } = useAuth();

  const room = useRoom(roomId);
  console.log("[Room] myRole =", room.myRole, "| permissions =", room.permissions);
  const playerRef = useRef(null);

  useDriftCorrection({
    playerRef,
    playState: room.playback?.playState ?? "paused",
    serverTime: room.playback?.currentTime ?? 0,
    updatedAt: room.playback?.serverTime,
    threshold: 2,
  });

  const [lastReaction, setLastReaction] = useState(null);
  useEffect(() => {
    const r = room.reactions[room.reactions.length - 1];
    if (!r) return;
    setLastReaction(r);
    const t = setTimeout(() => setLastReaction(null), 2500);
    return () => clearTimeout(t);
  }, [room.reactions]);

  useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    const playback = room.playback || {};
    const videoId = playback.videoId;
    const playState = playback.playState;
    const currentTime = playback.currentTime;
    if (!videoId) return;

    const local = p.getCurrentTime();
    if (Math.abs(local - currentTime) > 1.5) p.seek(currentTime);
    if (playState === "playing") p.play();
    else p.pause();
  }, [room.playback?.videoId, room.playback?.playState, room.playback?.currentTime]);

  const isHost = room.myRole === "host";

  return (
    <Box>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between", gap: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6">{`Room ${roomId}`}</Typography>
            {room.myRole ? (
              <Chip size="small" label={`You: ${room.myRole}`} color={isHost ? "warning" : "default"} />
            ) : null}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => navigator.clipboard.writeText(window.location.href)}
            >
              Copy invite link
            </Button>
            <Tooltip title="Leave room">
              <IconButton
                onClick={() => {
                  room.actions.leave();
                  navigate("/");
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 360px" }, gap: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Box
              sx={{
                position: "relative",
                aspectRatio: "16 / 9",
                background: "#000",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <PlayerHost
                ref={playerRef}
                videoId={room.playback?.videoId ?? null}
                onReady={() => {}}
                onUserPlay={() => room.permissions.canControl && room.actions.play()}
                onUserPause={() => room.permissions.canControl && room.actions.pause()}
                onUserSeek={(t) => room.permissions.canControl && room.actions.seek(t)}
                onEnded={() => isHost && room.actions.pause()}
              />
              {lastReaction ? (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    fontSize: 44,
                    pointerEvents: "none",
                    animation: "floatUp 2.4s ease-out",
                  }}
                >
                  {lastReaction.emoji}
                </Box>
              ) : null}
            </Box>

            <PlaybackControls
              canControl={room.permissions.canControl}
              canRequest={room.permissions.canRequest}
              playState={room.playback?.playState ?? "paused"}
              videoId={room.playback?.videoId ?? null}
              onChangeVideo={(id) => room.actions.changeVideo(id)}
              onPlay={() => room.actions.play()}
              onPause={() => room.actions.pause()}
              onRequest={(action, extra) => room.actions.requestAction(action, extra)}
            />
          </Paper>

          <Stack spacing={2}>
            <ParticipantsList
              participants={room.participants}
              meUserId={room.you?.userId ?? user?.userId}
              canModerate={room.permissions.canModerate}
              onAssign={(uid, role) => room.actions.assignRole(uid, role)}
              onRemove={(uid) => room.actions.removeParticipant(uid)}
            />
            <RequestsPanel
              requests={room.requests}
              canRequest={room.permissions.canRequest}
              canResolve={room.permissions.canResolve}
              onRequest={(action, extra) => room.actions.requestAction(action, extra)}
              onResolve={(id, decision) => room.actions.resolveRequest(id, decision)}
            />
            <ChatPanel
              messages={room.messages}
              canChat={room.permissions.canChat}
              onSend={(t) => room.actions.sendMessage(t)}
              onReact={(e) => room.actions.sendReaction(e)}
            />
          </Stack>
        </Box>
      </Container>

      <Snackbar
        open={Boolean(room.error)}
        autoHideDuration={4000}
        onClose={room.clearError}
        message={room.error ?? ""}
      />

      <Dialog open={Boolean(room.sessionReplaced)}>
        <DialogTitle>You opened this room in another tab</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This tab was replaced. Only one live connection per user is allowed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate("/")}>Back to home</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}