import { sibaApi } from "@/api/apiClient";

export async function createNotification({
  recipientEmail,
  title,
  message,
  type,
  link,
}) {
  await sibaApi.entities.Notification.create({
    recipient_email: recipientEmail,
    title,
    message,
    type: type || "system",
    is_read: false,
    link: link || "",
  });
}
