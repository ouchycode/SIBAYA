import { base44 } from "@/api/base44Client";

export async function createNotification({
  recipientEmail,
  title,
  message,
  type,
  link,
}) {
  await base44.entities.Notification.create({
    recipient_email: recipientEmail,
    title,
    message,
    type: type || "system",
    is_read: false,
    link: link || "",
  });
}
