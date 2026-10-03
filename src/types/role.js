// Mirrors the server's src/rooms/roles.js
export const ROLES = Object.freeze({
  HOST: "host",
  MODERATOR: "moderator",
  PARTICIPANT: "participant",
  VIEWER: "viewer",
});

/** The subset the host can assign (per ASSIGNABLE_ROLES in RoomModeration). */
export const ASSIGNABLE_ROLES = ["moderator", "participant", "viewer"];

export const ROLE_LABEL = {
  host: "Host",
  moderator: "Moderator",
  participant: "Participant",
  viewer: "Viewer",
};

/** Client-side convenience: can this role drive playback? */
export function canControlPlayback(role) {
  return role === ROLES.HOST || role === ROLES.MODERATOR;
}

/** Can this role send chat / reactions? (Host, Moderator, Participant — NOT Viewer.) */
export function canChat(role) {
  return role === ROLES.HOST || role === ROLES.MODERATOR || role === ROLES.PARTICIPANT;
}

/** Can this role create approval requests? (Participant only — Host/Mod act directly.) */
export function canRequest(role) {
  return role === ROLES.PARTICIPANT;
}

/** Can this role resolve approval requests? (Host + Moderator.) */
export function canResolveRequests(role) {
  return role === ROLES.HOST || role === ROLES.MODERATOR;
}

/** Can this role assign roles / remove participants? (Host only.) */
export function canModerateMembers(role) {
  return role === ROLES.HOST;
}