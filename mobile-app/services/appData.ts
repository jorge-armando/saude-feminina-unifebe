import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { APP_NOTIFICATION_STATE_KEY } from "./appNotificationState";
import { CALENDAR_NOTES_STORAGE_KEY } from "./calendarNotes";
import { DAILY_MESSAGE_STORAGE_KEY } from "./dailyMessage";
import { MENSTRUAL_CYCLES_STORAGE_KEY } from "./menstrualCycle";
import { NOTIFICATION_PREFERENCES_STORAGE_KEY } from "./notificationPreferencesStore";
import {
  LEGACY_REMINDERS_STORAGE_KEY,
  REMINDERS_STORAGE_KEY,
} from "./reminders";
import {
  USER_CREATED_AT_STORAGE_KEY,
  USER_NAME_STORAGE_KEY,
  WELCOME_STORAGE_KEY,
} from "./userProfile";

const APP_STORAGE_KEYS = [
  USER_NAME_STORAGE_KEY,
  USER_CREATED_AT_STORAGE_KEY,
  WELCOME_STORAGE_KEY,
  MENSTRUAL_CYCLES_STORAGE_KEY,
  CALENDAR_NOTES_STORAGE_KEY,
  DAILY_MESSAGE_STORAGE_KEY,
  NOTIFICATION_PREFERENCES_STORAGE_KEY,
  APP_NOTIFICATION_STATE_KEY,
  REMINDERS_STORAGE_KEY,
  LEGACY_REMINDERS_STORAGE_KEY,
  "dailyMessageDate",
  "dailyMessage",
  "dailyMessageIcon",
  "dailyMessageColors",
  "currentScreen",
] as const;

export interface ClearLocalAppDataResult {
  notificationCancellationFailed: boolean;
}

export async function clearLocalAppData(): Promise<ClearLocalAppDataResult> {
  let notificationCancellationFailed = false;

  if (Platform.OS !== "web") {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await Notifications.dismissAllNotificationsAsync();
    } catch {
      notificationCancellationFailed = true;
    }
  }

  await AsyncStorage.multiRemove([...APP_STORAGE_KEYS]);
  return { notificationCancellationFailed };
}
