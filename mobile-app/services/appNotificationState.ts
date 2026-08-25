import AsyncStorage from "@react-native-async-storage/async-storage";

export const APP_NOTIFICATION_STATE_KEY =
  "@saudeFeminina:notificationCenter:v1";

export interface AppNotificationState {
  version: 1;
  readIds: string[];
  dismissedIds: string[];
}

export class AppNotificationStateError extends Error {
  constructor(message = "O estado local das notificações está inválido.") {
    super(message);
    this.name = "AppNotificationStateError";
  }
}

const EMPTY_STATE: AppNotificationState = {
  version: 1,
  readIds: [],
  dismissedIds: [],
};

let mutationQueue: Promise<unknown> = Promise.resolve();

function uniqueIds(values: unknown) {
  if (!Array.isArray(values) || !values.every((item) => typeof item === "string")) {
    throw new AppNotificationStateError();
  }

  return [...new Set(values)].slice(-500);
}

function parseState(value: string): AppNotificationState {
  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new AppNotificationStateError();
  }

  if (!parsed || typeof parsed !== "object") {
    throw new AppNotificationStateError();
  }

  const candidate = parsed as Partial<AppNotificationState>;
  if (candidate.version !== 1) {
    throw new AppNotificationStateError(
      "A versão do estado local das notificações não é compatível.",
    );
  }

  return {
    version: 1,
    readIds: uniqueIds(candidate.readIds),
    dismissedIds: uniqueIds(candidate.dismissedIds),
  };
}

export async function loadAppNotificationState(): Promise<AppNotificationState> {
  const stored = await AsyncStorage.getItem(APP_NOTIFICATION_STATE_KEY);
  return stored ? parseState(stored) : { ...EMPTY_STATE };
}

function mutateState(
  mutation: (state: AppNotificationState) => AppNotificationState,
) {
  const operation = mutationQueue
    .catch(() => undefined)
    .then(async () => {
      const current = await loadAppNotificationState();
      const next = mutation(current);
      await AsyncStorage.setItem(APP_NOTIFICATION_STATE_KEY, JSON.stringify(next));
      return next;
    });

  mutationQueue = operation;
  return operation;
}

export function markAppNotificationsRead(ids: string[]) {
  const validIds = uniqueIds(ids);
  return mutateState((state) => ({
    ...state,
    readIds: uniqueIds([...state.readIds, ...validIds]),
  }));
}

export function dismissAppNotifications(ids: string[]) {
  const validIds = uniqueIds(ids);
  return mutateState((state) => ({
    ...state,
    readIds: uniqueIds([...state.readIds, ...validIds]),
    dismissedIds: uniqueIds([...state.dismissedIds, ...validIds]),
  }));
}

export async function resetAppNotificationState() {
  await AsyncStorage.removeItem(APP_NOTIFICATION_STATE_KEY);
  return { ...EMPTY_STATE };
}

