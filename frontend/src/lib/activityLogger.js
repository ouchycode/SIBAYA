import { sibaApi } from "@/api/apiClient";

export async function logActivity({
  actorEmail,
  actorName,
  actorRole,
  action,
  description,
  targetType,
  targetId,
}) {
  await sibaApi.entities.ActivityLog.create({
    actor_email: actorEmail,
    actor_name: actorName || actorEmail,
    actor_role: actorRole || "unknown",
    action,
    description,
    target_type: targetType || "",
    target_id: targetId || "",
  });
}
