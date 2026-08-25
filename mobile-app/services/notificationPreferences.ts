import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferencesFromStore,
  NotificationPreferences,
  NotificationPreferencesStorageError,
  NOTIFICATION_PREFERENCES_SCHEMA_VERSION,
  NOTIFICATION_PREFERENCES_STORAGE_KEY,
  saveNotificationPreferencesToStore,
  validateNotificationPreferences,
} from "./notificationPreferencesStore";
import { setReminderNotificationsEnabled } from "./reminders";

export {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferencesStorageError,
  NOTIFICATION_PREFERENCES_SCHEMA_VERSION,
  NOTIFICATION_PREFERENCES_STORAGE_KEY,
  validateNotificationPreferences,
};
export type { NotificationPreferences };

export type NotificationPreferencesUpdate = Partial<NotificationPreferences>;

const PREFERENCE_KEYS: ReadonlySet<keyof NotificationPreferences> = new Set([
  "appointmentReminders",
  "cyclePredictions",
  "contentUpdates",
]);

let notificationPreferencesQueue: Promise<void> = Promise.resolve();

function enqueueNotificationPreferencesOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  const result = notificationPreferencesQueue.then(operation, operation);
  notificationPreferencesQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function validatePreferencesUpdate(
  value: unknown
): NotificationPreferencesUpdate {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new NotificationPreferencesStorageError(
      "As alterações das preferências de notificação são inválidas."
    );
  }

  const entries = Object.entries(value);

  for (const [key, preferenceValue] of entries) {
    if (
      !PREFERENCE_KEYS.has(key as keyof NotificationPreferences) ||
      typeof preferenceValue !== "boolean"
    ) {
      throw new NotificationPreferencesStorageError(
        "As alterações das preferências de notificação são inválidas."
      );
    }
  }

  return { ...(value as NotificationPreferencesUpdate) };
}

async function rollbackAppointmentPreference(
  previousPreferences: NotificationPreferences
): Promise<void> {
  try {
    await saveNotificationPreferencesToStore(previousPreferences);
    await setReminderNotificationsEnabled(
      previousPreferences.appointmentReminders
    );
  } catch (error) {
    console.warn(
      "Falha ao restaurar as preferências de lembrete após um erro.",
      error
    );
  }
}

async function persistPreferencesUnsafe(
  nextPreferences: NotificationPreferences,
  previousPreferences: NotificationPreferences,
  synchronizeAppointmentReminders: boolean
): Promise<NotificationPreferences> {
  const savedPreferences = await saveNotificationPreferencesToStore(
    nextPreferences
  );

  if (!synchronizeAppointmentReminders) {
    return savedPreferences;
  }

  try {
    await setReminderNotificationsEnabled(
      savedPreferences.appointmentReminders
    );
  } catch (error) {
    await rollbackAppointmentPreference(previousPreferences);
    throw error;
  }

  return savedPreferences;
}

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  return enqueueNotificationPreferencesOperation(() =>
    loadNotificationPreferencesFromStore()
  );
}

export async function saveNotificationPreferences(
  value: unknown
): Promise<NotificationPreferences> {
  const nextPreferences = validateNotificationPreferences(value);

  return enqueueNotificationPreferencesOperation(async () => {
    const previousPreferences = await loadNotificationPreferencesFromStore();
    return persistPreferencesUnsafe(
      nextPreferences,
      previousPreferences,
      nextPreferences.appointmentReminders !==
        previousPreferences.appointmentReminders
    );
  });
}

export async function updateNotificationPreferences(
  value: unknown
): Promise<NotificationPreferences> {
  const update = validatePreferencesUpdate(value);

  return enqueueNotificationPreferencesOperation(async () => {
    const previousPreferences = await loadNotificationPreferencesFromStore();
    const nextPreferences = validateNotificationPreferences({
      ...previousPreferences,
      ...update,
    });

    return persistPreferencesUnsafe(
      nextPreferences,
      previousPreferences,
      Object.prototype.hasOwnProperty.call(update, "appointmentReminders")
    );
  });
}

export async function setAppointmentRemindersEnabled(
  enabled: boolean
): Promise<NotificationPreferences> {
  if (typeof enabled !== "boolean") {
    throw new NotificationPreferencesStorageError(
      "O estado dos lembretes de compromissos é inválido."
    );
  }

  return updateNotificationPreferences({ appointmentReminders: enabled });
}
