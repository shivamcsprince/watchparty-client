import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Alert, Box, Button, Container, Link, Paper, Stack, TextField, Typography,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext.jsx";
import { humanizeError } from "../utils/format.js";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr(null);

    if (username.trim().length < 3) {
      setErr("Username must be at least 3 characters.");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      await register(email.trim(), password, username.trim());
      navigate("/", { replace: true });
    } catch (e) {
      setErr(humanizeError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>Create account</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          One account, any watch party.
        </Typography>

        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            {err && <Alert severity="error">{err}</Alert>}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              fullWidth
            />
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              inputProps={{ minLength: 3, maxLength: 32 }}
              helperText="At least 3 characters. Shown in the room."
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              inputProps={{ minLength: 6 }}
              helperText="At least 6 characters."
              required
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </Button>
            <Box textAlign="center">
              <Link component={RouterLink} to="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}