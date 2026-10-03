import { createTheme } from "@mui/material/styles";

/**
 * Material UI theme. The palette mode is passed in at runtime so
 * App.jsx can flip between light and dark; here we only define shape
 * and typography that shouldn't change.
 */
export function buildTheme(mode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: mode === "dark" ? "#90caf9" : "#1976d2" },
      secondary: { main: mode === "dark" ? "#f48fb1" : "#d81b60" },
      background:
        mode === "dark"
          ? { default: "#0f1115", paper: "#171a21" }
          : { default: "#f5f6f8", paper: "#ffffff" },
    },
    shape: { borderRadius: 10 },
    typography: {
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
  });
}