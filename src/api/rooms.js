import { apiFetch } from "./http.js";

export function createRoom(token) {
  return apiFetch("/api/rooms", { method: "POST", token });
}