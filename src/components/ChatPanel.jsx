import { useState } from "react";
import { Box, Button, IconButton, Paper, Stack, TextField, Tooltip, Typography } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { ALLOWED_REACTIONS, CHAT_MAX_LENGTH } from "../types/room.js";
import { formatClock } from "../utils/format.js";

export default function ChatPanel({ messages, canChat, onSend, onReact }) {
  const [text, setText] = useState("");

  function submit(e) {
    e.preventDefault();
    if (!canChat) return;
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Chat</Typography>

      <Box sx={{ maxHeight: 220, overflowY: "auto", pr: 1, mb: 1 }}>
        {messages.length === 0 && (
          <Typography variant="caption" color="text.secondary">No messages yet.</Typography>
        )}
        {messages.map((m) => (
          <Box key={m.id} sx={{ mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              {formatClock(m.sentAt)}
            </Typography>
            <Typography variant="body2" component="span" fontWeight={600}>{m.username}:</Typography>{" "}
            <Typography variant="body2" component="span">{m.text}</Typography>
          </Box>
        ))}
      </Box>

      <Stack direction="row" spacing={0.5} mb={1} sx={{ flexWrap: "wrap" }}>
        {ALLOWED_REACTIONS.map((e) => (
          <Tooltip key={e} title={canChat ? `React ${e}` : "Not allowed for your role"}>
            <span>
              <IconButton size="small" disabled={!canChat} onClick={() => onReact(e)}>
                {e}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </Stack>

      <form onSubmit={submit}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder={canChat ? "Say something…" : "Your role cannot chat"}
            value={text}
            disabled={!canChat}
            onChange={(e) => setText(e.target.value)}
            slotProps={{ htmlInput: { maxLength: CHAT_MAX_LENGTH } }}
          />
          <Button type="submit" variant="contained" endIcon={<SendIcon />} disabled={!canChat}>
            Send
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}