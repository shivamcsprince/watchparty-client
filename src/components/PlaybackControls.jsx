import { useState } from "react";
import { Box, Button, IconButton, Stack, TextField, Tooltip, Typography, Chip } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { extractVideoId } from "../utils/youtube.js";

export default function PlaybackControls({
  canControl,
  canRequest,
  playState,
  videoId,
  onChangeVideo,
  onPlay,
  onPause,
  onRequest,
}) {
  const [url, setUrl] = useState("");
  const [err, setErr] = useState(null);

  function submitVideo() {
  setErr(null);
  const id = extractVideoId(url.trim());
  if (!id) {
    setErr("Not a valid YouTube URL or video id.");
    return;
  }
  if (canControl) onChangeVideo(id);
  else if (canRequest) onRequest("change_video", { videoId: id });
  setUrl("");
}

  const nothingAllowed = !canControl && !canRequest;

  return (
    <Box mt={2}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
        <Tooltip title={canControl ? "Play" : "You can request a play"}>
          <span>
            <IconButton
              color="primary"
              disabled={nothingAllowed || playState === "playing"}
              onClick={() => (canControl ? onPlay() : onRequest("play"))}
              aria-label="play"
            >
              <PlayArrowIcon />
            </IconButton>
          </span>
        </Tooltip>

        <Tooltip title={canControl ? "Pause" : "You can request a pause"}>
          <span>
            <IconButton
              color="primary"
              disabled={nothingAllowed || playState === "paused"}
              onClick={() => (canControl ? onPause() : onRequest("pause"))}
              aria-label="pause"
            >
              <PauseIcon />
            </IconButton>
          </span>
        </Tooltip>

        <TextField
          size="small"
          label="YouTube URL or id"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitVideo()}
          error={!!err}
          helperText={
            err ??
            (canControl ? "Change the video for everyone" : canRequest ? "Sends a request to the host" : " ")
          }
          sx={{ minWidth: 300 }}
        />

        <Button
          variant="contained"
          startIcon={<SwapHorizIcon />}
          onClick={submitVideo}
          disabled={nothingAllowed}
        >
          {canControl ? "Change video" : "Request video"}
        </Button>

        {videoId && (
          <Chip size="small" label={`Current: ${videoId}`} sx={{ ml: "auto" }} />
        )}
      </Stack>

      {canRequest && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          You are a Participant — your actions are sent as requests and need a Host or Moderator to approve.
        </Typography>
      )}
    </Box>
  );
}