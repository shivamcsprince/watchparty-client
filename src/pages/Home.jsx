import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar, Box, Button, Container, IconButton, Paper, Stack, TextField, Toolbar, Typography, Tooltip, Alert,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import AddIcon from "@mui/icons-material/Add";
import LoginIcon from "@mui/icons-material/Login";
import { useAuth } from "../auth/AuthContext.jsx";
import { createRoom } from "../api/rooms.js";
import { isValidRoomCode } from "../types/room.js";
import { humanizeError } from "../utils/format.js";

export default function Home() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [code, setCode] = useState("");
  const [err, setErr] = useState(null);
  const [creating, setCreating] = useState(false);

  async function onCreate() {
    setErr(null);
    setCreating(true);
    try {
      const { room } = await createRoom(token);
      navigate(`/room/${room.code}`);
    } catch (e) {
      setErr(humanizeError(e));
    } finally {
      setCreating(false);
    }
  }

  function onJoin() {
    const c = code.trim().toUpperCase();
    if (!isValidRoomCode(c)) {
      setErr("Room codes are 8 characters. Check the invite link.");
      return;
    }
    setErr(null);
    navigate(`/room/${c}`);
  }

  return (
    <>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6">Watch Party</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" color="text.secondary">{user?.username}</Typography>
            <Tooltip title="Sign out">
              <IconButton onClick={logout}><LogoutIcon /></IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Start watching together</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create a room and share the code, or paste a code you were given.
          </Typography>

          <Stack spacing={2}>
            {err && <Alert severity="error" onClose={() => setErr(null)}>{err}</Alert>}

            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={onCreate}
              disabled={creating}
            >
              {creating ? "Creating…" : "Create a room"}
            </Button>

            <Typography variant="caption" color="text.secondary" align="center">
              or join an existing one
            </Typography>

            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                label="Room code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                inputProps={{ maxLength: 8 }}
                onKeyDown={(e) => e.key === "Enter" && onJoin()}
              />
              <Button variant="outlined" startIcon={<LoginIcon />} onClick={onJoin}>
                Join
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </>
  );
}