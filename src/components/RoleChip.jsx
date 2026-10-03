import { Chip } from "@mui/material";
import { ROLE_LABEL, ROLES } from "../types/role.js";

const COLOR = {
  [ROLES.HOST]: "warning",
  [ROLES.MODERATOR]: "primary",
  [ROLES.PARTICIPANT]: "default",
  [ROLES.VIEWER]: "success",
};

export default function RoleChip({ role, size = "small" }) {
  return <Chip size={size} label={ROLE_LABEL[role] ?? role} color={COLOR[role] ?? "default"} />;
}