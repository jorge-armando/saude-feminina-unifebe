import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import {
  AppNotificationState,
  dismissAppNotifications,
  loadAppNotificationState,
  markAppNotificationsRead,
  resetAppNotificationState,
} from "../services/appNotificationState";

const EMPTY_STATE: AppNotificationState = {
  version: 1,
  readIds: [],
  dismissedIds: [],
};

export function useAppNotificationState() {
  const isFocused = useIsFocused();
  const [state, setState] = useState<AppNotificationState>(EMPTY_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setState(await loadAppNotificationState());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Não foi possível carregar o estado das notificações.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      void refresh();
    }
  }, [isFocused, refresh]);

  const runMutation = useCallback(
    async (operation: () => Promise<AppNotificationState>) => {
      setIsSaving(true);
      setError(null);

      try {
        const next = await operation();
        setState(next);
        return true;
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Não foi possível salvar esta alteração.",
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const markRead = useCallback(
    (ids: string | string[]) =>
      runMutation(() =>
        markAppNotificationsRead(Array.isArray(ids) ? ids : [ids]),
      ),
    [runMutation],
  );

  const dismiss = useCallback(
    (ids: string | string[]) =>
      runMutation(() =>
        dismissAppNotifications(Array.isArray(ids) ? ids : [ids]),
      ),
    [runMutation],
  );

  const repair = useCallback(
    () => runMutation(() => resetAppNotificationState()),
    [runMutation],
  );

  return {
    state,
    isLoading,
    isSaving,
    error,
    refresh,
    markRead,
    dismiss,
    repair,
  };
}

