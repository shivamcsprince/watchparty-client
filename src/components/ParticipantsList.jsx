import { Button, List, ListItem, ListItemText, MenuItem, Paper, Select, Stack, Typography } from "@mui/material";
import RoleChip from "./RoleChip.jsx";
import { ASSIGNABLE_ROLES, ROLE_LABEL, ROLES } from "../types/role.js";

export default function ParticipantsList({
  participants,
  meUserId,
  canModerate,
  onAssign,
  onRemove,
}) {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Participants ({participants.length})
      </Typography>

      <List dense>
        {participants.map((p) => {
          const isMe = p.userId === meUserId;
          return (
            <ListItem key={p.userId} disableGutters sx={{ alignItems: "flex-start" }}>
              <ListItemText
                primary={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <span>{p.username}{isMe ? " (you)" : ""}</span>
                    <RoleChip role={p.role} />
                  </Stack>
                }
              />
              {canModerate && !isMe && p.role !== ROLES.HOST && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Select
                    size="small"
                    value={p.role}
                    onChange={(e) => onAssign(p.userId, e.target.value)}
                    sx={{ minWidth: 130 }}
                  >
                    {ASSIGNABLE_ROLES.map((r) => (
                      <MenuItem key={r} value={r}>{ROLE_LABEL[r]}</MenuItem>
                    ))}
                  </Select>
                  <Button size="small" color="error" onClick={() => onRemove(p.userId)}>
                    Remove
                  </Button>
                </Stack>
              )}
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
}