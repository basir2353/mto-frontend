import { vapidPublicKey, hasWebPush } from "@/lib/env";
import { notificationsApi } from "@/lib/api";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!hasWebPush || typeof window === "undefined") return null;
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });
}

export async function registerPushServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
}

export async function enablePushNotifications() {
  await registerPushServiceWorker();
  const subscription = await subscribeToPushNotifications();
  if (subscription) {
    await notificationsApi.savePushSubscription(subscription.toJSON());
  }
  return subscription;
}

export async function disablePushNotifications() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await notificationsApi.removePushSubscription(subscription.endpoint);
  await subscription.unsubscribe();
}

export async function syncGrantedPushSubscription() {
  if (typeof window === "undefined" || Notification.permission !== "granted") return;
  await enablePushNotifications();
}

export function getVapidPublicKey() {
  return vapidPublicKey;
}
