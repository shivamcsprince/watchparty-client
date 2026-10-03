import { useMemo, useState } from "react";
import { CssBaseline, ThemeProvider, Box, IconButton, Tooltip } from "@mui/material";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import { Navigate, Route, Routes } from "react-router-dom";

import { buildTheme } from "./theme.js";
import RequireAuth from "./auth/RequireAuth.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Room from "./pages/Room.jsx";

const THEME_KEY = "wp_theme";

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem(THEME_KEY) || "dark");
  const theme = useMemo(() => buildTheme(mode), [mode]);

  function toggleMode() {
    setMode((m) => {
      const next = m === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{ position: "fixed", top: 8, right: 8, zIndex: 1300 }}>
        <Tooltip title={mode === "dark" ? "Switch to light" : "Switch to dark"}>
          <IconButton onClick={toggleMode} size="small">
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route
          path="/room/:roomId"
          element={
            <RequireAuth>
              <Room />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}