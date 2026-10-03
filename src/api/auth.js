import { apiFetch } from "./http.js";

export function register({ email, password, username }) {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: { email, password, username },
  });
}

export function login({ email, password }) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function me(token) {
  return apiFetch("/api/auth/me", { token });
}