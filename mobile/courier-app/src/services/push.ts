import * as Notifications from "expo-notifications";

export async function registerPushToken(): Promise<string | null> {
  const perms = await Notifications.requestPermissionsAsync();
  if (perms.status !== "granted") return null;
  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}
