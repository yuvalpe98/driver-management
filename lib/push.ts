import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export async function sendPush(
  userId: string,
  payload: { title: string; body: string; url: string },
) {
  const subject = process.env.VAPID_EMAIL;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!subject || !publicKey || !privateKey) {
    console.warn("Web-push VAPID env vars missing; skipping push notification.");
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return;

  await Promise.allSettled(
    subs.map((s) =>
      webpush
        .sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        )
        .catch(() =>
          prisma.pushSubscription.delete({ where: { endpoint: s.endpoint } }).catch(() => {}),
        ),
    ),
  );
}
