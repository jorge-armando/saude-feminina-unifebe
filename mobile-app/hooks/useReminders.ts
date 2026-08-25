import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createReminder as createReminderRecord,
  deleteReminder as deleteReminderRecord,
  getReminderNotificationStatus,
  loadReminders,
  Reminder,
  ReminderInput,
  ReminderNotificationStatus,
  ReminderNotificationSyncResult,
  remindersNeedNotificationSync,
  setReminderNotificationsEnabled,
  syncReminderNotifications,
  updateReminder as updateReminderRecord,
  ReminderUpdateInput,
} from "../services/reminders";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  loadNotificationPreferences,
  NotificationPreferences,
  NotificationPreferencesUpdate,
  setAppointmentRemindersEnabled,
  updateNotificationPreferences,
} from "../services/notificationPreferences";

const FALLBACK_ERROR_MESSAGE =
  "Não foi possível acessar os lembretes salvos neste aparelho.";

function getReadableError(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : FALLBACK_ERROR_MESSAGE;
}

export function useReminders() {
  const isFocused = useIsFocused();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    ...DEFAULT_NOTIFICATION_PREFERENCES,
  });
  const [notificationStatus, setNotificationStatus] =
    useState<ReminderNotificationStatus>(getReminderNotificationStatus());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(false);
  const refreshRequestRef = useRef(0);
  const pendingMutationsRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      refreshRequestRef.current += 1;
    };
  }, []);

  const refresh = useCallback(async () => {
    const requestId = refreshRequestRef.current + 1;
    refreshRequestRef.current = requestId;

    if (isMountedRef.current) {
      setIsLoading(true);
    }

    try {
      const [storedReminders, storedPreferences] = await Promise.all([
        loadReminders(),
        loadNotificationPreferences(),
      ]);
      let refreshedReminders = storedReminders;
      let refreshedNotificationStatus = getReminderNotificationStatus();

      if (
        remindersNeedNotificationSync(
          storedReminders,
          storedPreferences.appointmentReminders
        )
      ) {
        const syncResult = await setReminderNotificationsEnabled(
          storedPreferences.appointmentReminders
        );
        refreshedReminders = syncResult.reminders;
        refreshedNotificationStatus = syncResult.status;
      }

      if (
        isMountedRef.current &&
        requestId === refreshRequestRef.current
      ) {
        setReminders(refreshedReminders);
        setPreferences(storedPreferences);
        setNotificationStatus(refreshedNotificationStatus);
        setError(null);
      }
    } catch (refreshError) {
      if (
        isMountedRef.current &&
        requestId === refreshRequestRef.current
      ) {
        setError(getReadableError(refreshError));
      }
    } finally {
      if (
        isMountedRef.current &&
        requestId === refreshRequestRef.current
      ) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      void refresh();
      return;
    }

    refreshRequestRef.current += 1;
  }, [isFocused, refresh]);

  const beginMutation = useCallback(() => {
    pendingMutationsRef.current += 1;

    if (isMountedRef.current) {
      setIsSaving(true);
    }
  }, []);

  const finishMutation = useCallback(() => {
    pendingMutationsRef.current = Math.max(
      0,
      pendingMutationsRef.current - 1
    );

    if (isMountedRef.current && pendingMutationsRef.current === 0) {
      setIsSaving(false);
    }
  }, []);

  const refreshReminderStateAfterMutation = useCallback(async () => {
    const storedReminders = await loadReminders();

    if (isMountedRef.current) {
      setReminders(storedReminders);
    }

    return storedReminders;
  }, []);

  const addReminder = useCallback(
    async (input: ReminderInput) => {
      beginMutation();

      try {
        const reminder = await createReminderRecord(input);
        await refreshReminderStateAfterMutation();

        if (isMountedRef.current) {
          setError(null);
        }

        return reminder;
      } catch (mutationError) {
        if (isMountedRef.current) {
          setError(getReadableError(mutationError));
        }
        throw mutationError;
      } finally {
        finishMutation();
      }
    },
    [beginMutation, finishMutation, refreshReminderStateAfterMutation]
  );

  const editReminder = useCallback(
    async (reminderId: string, updates: ReminderUpdateInput) => {
      beginMutation();

      try {
        const reminder = await updateReminderRecord(reminderId, updates);
        await refreshReminderStateAfterMutation();

        if (isMountedRef.current) {
          setError(null);
        }

        return reminder;
      } catch (mutationError) {
        if (isMountedRef.current) {
          setError(getReadableError(mutationError));
        }
        throw mutationError;
      } finally {
        finishMutation();
      }
    },
    [beginMutation, finishMutation, refreshReminderStateAfterMutation]
  );

  const removeReminder = useCallback(
    async (reminderId: string) => {
      beginMutation();

      try {
        await deleteReminderRecord(reminderId);
        await refreshReminderStateAfterMutation();

        if (isMountedRef.current) {
          setError(null);
        }
      } catch (mutationError) {
        if (isMountedRef.current) {
          setError(getReadableError(mutationError));
        }
        throw mutationError;
      } finally {
        finishMutation();
      }
    },
    [beginMutation, finishMutation, refreshReminderStateAfterMutation]
  );

  const changePreferences = useCallback(
    async (update: NotificationPreferencesUpdate) => {
      beginMutation();

      try {
        const nextPreferences = await updateNotificationPreferences(update);
        const nextReminders = await refreshReminderStateAfterMutation();

        if (isMountedRef.current) {
          setPreferences(nextPreferences);
          setNotificationStatus(getReminderNotificationStatus());
          setReminders(nextReminders);
          setError(null);
        }

        return nextPreferences;
      } catch (mutationError) {
        if (isMountedRef.current) {
          setError(getReadableError(mutationError));
        }
        throw mutationError;
      } finally {
        finishMutation();
      }
    },
    [beginMutation, finishMutation, refreshReminderStateAfterMutation]
  );

  const toggleAppointmentReminders = useCallback(
    async (enabled: boolean) => {
      beginMutation();

      try {
        const nextPreferences = await setAppointmentRemindersEnabled(enabled);
        const nextReminders = await refreshReminderStateAfterMutation();

        if (isMountedRef.current) {
          setPreferences(nextPreferences);
          setReminders(nextReminders);
          setNotificationStatus(getReminderNotificationStatus());
          setError(null);
        }

        return nextPreferences;
      } catch (mutationError) {
        if (isMountedRef.current) {
          setError(getReadableError(mutationError));
        }
        throw mutationError;
      } finally {
        finishMutation();
      }
    },
    [beginMutation, finishMutation, refreshReminderStateAfterMutation]
  );

  const synchronizeNotifications = useCallback(async () => {
    beginMutation();

    try {
      const result: ReminderNotificationSyncResult =
        await syncReminderNotifications();

      if (isMountedRef.current) {
        setReminders(result.reminders);
        setNotificationStatus(result.status);
        setError(null);
      }

      return result;
    } catch (mutationError) {
      if (isMountedRef.current) {
        setError(getReadableError(mutationError));
      }
      throw mutationError;
    } finally {
      finishMutation();
    }
  }, [beginMutation, finishMutation]);

  return {
    reminders,
    records: reminders,
    preferences,
    notificationStatus,
    isLoading,
    isSaving,
    error,
    refresh,
    addReminder,
    createReminder: addReminder,
    editReminder,
    updateReminder: editReminder,
    removeReminder,
    deleteReminder: removeReminder,
    changePreferences,
    toggleAppointmentReminders,
    synchronizeNotifications,
  };
}
