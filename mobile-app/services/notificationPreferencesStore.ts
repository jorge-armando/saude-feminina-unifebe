import AsyncStorage from "@react-native-async-storage/async-storage";

export const NOTIFICATION_PREFERENCES_STORAGE_KEY =
  "@saudeFeminina:notificationPreferences:v1";
export const NOTIFICATION_PREFERENCES_SCHEMA_VERSION = 1 as const;

export interface NotificationPreferences {
  appointmentReminders: boolean;
  cyclePredictions: boolean;
  contentUpdates: boolean;
}

interface NotificationPreferencesStorageV1 {
  version: typeof NOTIFICATION_PREFERENCES_SCHEMA_VERSION;
  preferences: NotificationPreferences;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: Readonly<NotificationPreferences> =
  Object.freeze({
    appointmentReminders: true,
    cyclePredictions: true,
    contentUpdates: true,
  });

export class NotificationPreferencesStorageError extends Error {
  readonly cause?: unknown;

  constructor(
    message =
      "As preferências de notificação salvas neste aparelho estão em um formato inválido.",
    cause?: unknown
  ) {
    super(message);
    this.name = "NotificationPreferencesStorageError";
    this.cause = cause;
  }
}

let preferencesStorageQueue: Promise<void> = Promise.resolve();

function enqueuePreferencesStorageOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  const result = preferencesStorageQueue.then(operation, operation);
  preferencesStorageQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export function validateNotificationPreferences(
  value: unknown
): NotificationPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new NotificationPreferencesStorageError();
  }

  const preferences = value as Partial<NotificationPreferences>;

  if (
    typeof preferences.appointmentReminders !== "boolean" ||
    typeof preferences.cyclePredictions !== "boolean" ||
    typeof preferences.contentUpdates !== "boolean"
  ) {
    throw new NotificationPreferencesStorageError();
  }

  return {
    appointmentReminders: preferences.appointmentReminders,
    cyclePredictions: preferences.cyclePredictions,
    contentUpdates: preferences.contentUpdates,
  };
}

function parseStoredPreferences(storedValue: string): NotificationPreferences {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(storedValue);
  } catch (error) {
    throw new NotificationPreferencesStorageError(undefined, error);
  }

  if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
    throw new NotificationPreferencesStorageError();
  }

  const storage = parsedValue as Partial<NotificationPreferencesStorageV1>;

  if (storage.version !== NOTIFICATION_PREFERENCES_SCHEMA_VERSION) {
    throw new NotificationPreferencesStorageError(
      "A versão das preferências de notificação salvas não é compatível com este aplicativo."
    );
  }

  return validateNotificationPreferences(storage.preferences);
}

export async function loadNotificationPreferencesFromStore(): Promise<NotificationPreferences> {
  return enqueuePreferencesStorageOperation(async () => {
    let storedValue: string | null;

    try {
      storedValue = await AsyncStorage.getItem(
        NOTIFICATION_PREFERENCES_STORAGE_KEY
      );
    } catch (error) {
      throw new NotificationPreferencesStorageError(
        "Não foi possível acessar as preferências de notificação salvas neste aparelho.",
        error
      );
    }

    if (storedValue === null) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }

    return parseStoredPreferences(storedValue);
  });
}

export async function saveNotificationPreferencesToStore(
  value: unknown
): Promise<NotificationPreferences> {
  const preferences = validateNotificationPreferences(value);

  return enqueuePreferencesStorageOperation(async () => {
    const storage: NotificationPreferencesStorageV1 = {
      version: NOTIFICATION_PREFERENCES_SCHEMA_VERSION,
      preferences,
    };

    try {
      await AsyncStorage.setItem(
        NOTIFICATION_PREFERENCES_STORAGE_KEY,
        JSON.stringify(storage)
      );
    } catch (error) {
      throw new NotificationPreferencesStorageError(
        "Não foi possível salvar as preferências de notificação neste aparelho.",
        error
      );
    }

    return { ...preferences };
  });
}
