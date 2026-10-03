import { useState } from "react";
import { Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { REQUEST_ACTIONS } from "../types/room.js";
import { extractVideoId } from "../utils/youtube.js";

export default function RequestsPanel({ requests, canRequest, canResolve, onRequest, onResolve }) {
  const [seekTime, setSeekTime] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoErr, setVideoErr] = useState(null);

  function submitSeek() {
    const t = Number(seekTime);
    if (!Number.isFinite(t) || t < 0) return;
    onRequest("seek", { time: t });
    setSeekTime("");
  }

  function submitVideo() {
    const id = extractVideoId(videoUrl);
    if (!id) {
      setVideoErr("Invalid YouTube URL or id.");
      return;
    }
    setVideoErr(null);
    onRequest("change_video", { videoId: id });
    setVideoUrl("");
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Requests {requests.length > 0 ? `(${requests.length})` : ""}
      </Typography>

      {canRequest && (
        <Stack spacing={1} mb={2}>
          <Typography variant="caption" color="text.secondary">
            Ask the host or a moderator to act.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" onClick={() => onRequest("play")}>Request play</Button>
            <Button size="small" variant="outlined" onClick={() => onRequest("pause")}>Request pause</Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Seek to (seconds)"
              value={seekTime}
              onChange={(e) => setSeekTime(e.target.value)}
              type="number"
              slotProps={{ htmlInput: { min: 0 } }}
            />
            <Button size="small" variant="outlined" onClick={submitSeek} disabled={!seekTime}>
              Request seek
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              fullWidth
              label="YouTube URL"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              error={!!videoErr}
              helperText={videoErr ?? ""}
            />
            <Button size="small" variant="outlined" onClick={submitVideo}>
              Request video
            </Button>
          </Stack>
        </Stack>
      )}

      {requests.length === 0 ? (
        <Typography variant="caption" color="text.secondary">No pending requests.</Typography>
      ) : (
        <Stack spacing={1}>
          {requests.map((r) => (
            <Stack key={r.id} direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={r.action} />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {r.requestedBy?.username ?? "?"}
                {r.params?.time != null ? ` → ${r.params.time}s` : ""}
                {r.params?.videoId ? ` → ${r.params.videoId}` : ""}
              </Typography>
              {canResolve && (
                <>
                  <Button size="small" startIcon={<CheckIcon />} onClick={() => onResolve(r.id, "approve")}>
                    Approve
                  </Button>
                  <Button size="small" color="error" startIcon={<CloseIcon />} onClick={() => onResolve(r.id, "reject")}>
                    Reject
                  </Button>
                </>
              )}
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
}