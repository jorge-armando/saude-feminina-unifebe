import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { loadNotificationPreferencesFromStore } from "./notificationPreferencesStore";

export const REMINDERS_STORAGE_KEY = "@saudeFeminina:reminders:v1";
export const LEGACY_REMINDERS_STORAGE_KEY = "userReminders";
export const REMINDERS_SCHEMA_VERSION = 1 as const;
export const REMINDER_NOTIFICATION_CHANNEL_ID = "appointment-reminders";

export type ReminderRepeat =
  | "none"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly";

export interface Reminder {
  id: string;
  title: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  emoji: string;
  notes?: string;
  repeat: ReminderRepeat;
  timezone: string;
  notificationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderInput {
  title: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  emoji?: string;
  notes?: string;
  repeat?: ReminderRepeat;
  timezone?: string;
}

export type ReminderUpdateInput = Partial<ReminderInput>;

export type ReminderDateFields = Pick<
  ReminderInput,
  "day" | "month" | "year" | "hour" | "minute"
> & {
  timezone?: string;
};

export interface ValidateReminderInputOptions {
  requireFuture?: boolean;
  now?: Date;
}

export type ReminderNotificationStatus =
  | "available"
  | "permission-denied"
  | "unsupported";

export interface ReminderNotificationSyncResult {
  reminders: Reminder[];
  status: ReminderNotificationStatus;
  scheduledCount: number;
  cancelledCount: number;
}

interface RemindersStorageV1 {
  version: typeof REMINDERS_SCHEMA_VERSION;
  reminders: Reminder[];
}

interface ParsedReminderDateFields {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
  timezone: string;
}

interface SchedulingResult {
  notificationId: string | null;
  status: ReminderNotificationStatus;
}

const REMINDER_REPEATS: ReadonlySet<ReminderRepeat> = new Set([
  "none",
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);
const DEFAULT_REMINDER_EMOJI = "📅";
const MAX_TITLE_LENGTH = 120;
const MAX_NOTES_LENGTH = 1000;

export class ReminderStorageError extends Error {
  readonly cause?: unknown;

  constructor(
    message =
      "Os lembretes salvos neste aparelho estão em um formato inválido.",
    cause?: unknown
  ) {
    super(message);
    this.name = "ReminderStorageError";
    this.cause = cause;
  }
}

export class ReminderValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReminderValidationError";
  }
}

export class ReminderNotFoundError extends Error {
  constructor() {
    super("O lembrete solicitado não foi encontrado.");
    this.name = "ReminderNotFoundError";
  }
}

export class ReminderNotificationError extends Error {
  readonly cause?: unknown;

  constructor(
    message = "Não foi possível atualizar a notificação deste lembrete.",
    cause?: unknown
  ) {
    super(message);
    this.name = "ReminderNotificationError";
    this.cause = cause;
  }
}

let remindersOperationQueue: Promise<void> = Promise.resolve();
let lastReminderNotificationStatus: ReminderNotificationStatus =
  isNativeNotificationEnvironment() ? "available" : "unsupported";

function enqueueReminderOperation<T>(operation: () => Promise<T>): Promise<T> {
  const result = remindersOperationQueue.then(operation, operation);
  remindersOperationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function cloneReminder(reminder: Reminder): Reminder {
  return { ...reminder };
}

function cloneReminders(reminders: Reminder[]): Reminder[] {
  return reminders.map(cloneReminder);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseNumericString(
  value: unknown,
  fieldLabel: string,
  minimum: number,
  maximum: number,
  maximumLength = 2
): number {
  if (typeof value !== "string") {
    throw new ReminderValidationError(`${fieldLabel} precisa ser informado.`);
  }

  const trimmedValue = value.trim();

  if (
    !new RegExp(`^\\d{1,${maximumLength}}$`).test(trimmedValue) ||
    Number(trimmedValue) < minimum ||
    Number(trimmedValue) > maximum
  ) {
    throw new ReminderValidationError(`${fieldLabel} é inválido.`);
  }

  return Number(trimmedValue);
}

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getDeviceTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone && isValidTimezone(timezone) ? timezone : "UTC";
  } catch {
    return "UTC";
  }
}

function parseReminderDateFields(value: unknown): ParsedReminderDateFields {
  if (!isRecord(value)) {
    throw new ReminderValidationError("Informe uma data e um horário válidos.");
  }

  const year = parseNumericString(value.year, "O ano", 1, 9999, 4);
  const month = parseNumericString(value.month, "O mês", 1, 12);
  const day = parseNumericString(value.day, "O dia", 1, 31);
  const hour = parseNumericString(value.hour, "A hora", 0, 23);
  const minute = parseNumericString(value.minute, "O minuto", 0, 59);
  const validationDate = new Date(Date.UTC(year, month - 1, day));

  if (
    validationDate.getUTCFullYear() !== year ||
    validationDate.getUTCMonth() !== month - 1 ||
    validationDate.getUTCDate() !== day
  ) {
    throw new ReminderValidationError(
      "A data informada não existe no calendário."
    );
  }

  const timezone =
    value.timezone === undefined
      ? getDeviceTimezone()
      : typeof value.timezone === "string"
        ? value.timezone.trim()
        : "";

  if (!timezone || !isValidTimezone(timezone)) {
    throw new ReminderValidationError("O fuso horário informado é inválido.");
  }

  return { day, month, year, hour, minute, timezone };
}

function getDatePartsInTimezone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-gregory", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values: Record<string, number> = {};

  for (const part of parts) {
    if (
      part.type === "year" ||
      part.type === "month" ||
      part.type === "day" ||
      part.type === "hour" ||
      part.type === "minute" ||
      part.type === "second"
    ) {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function zonedDateTimeToTimestamp(fields: ParsedReminderDateFields): number {
  const desiredTimestamp = Date.UTC(
    fields.year,
    fields.month - 1,
    fields.day,
    fields.hour,
    fields.minute,
    0,
    0
  );
  let candidateTimestamp = desiredTimestamp;

  // Intl não fornece o offset diretamente. A pequena iteração abaixo
  // converge inclusive nos limites de horário de verão.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const candidateParts = getDatePartsInTimezone(
      new Date(candidateTimestamp),
      fields.timezone
    );
    const representedTimestamp = Date.UTC(
      candidateParts.year,
      candidateParts.month - 1,
      candidateParts.day,
      candidateParts.hour,
      candidateParts.minute,
      candidateParts.second,
      0
    );
    const nextCandidate =
      candidateTimestamp + (desiredTimestamp - representedTimestamp);

    if (nextCandidate === candidateTimestamp) {
      break;
    }

    candidateTimestamp = nextCandidate;
  }

  const finalParts = getDatePartsInTimezone(
    new Date(candidateTimestamp),
    fields.timezone
  );

  if (
    finalParts.year !== fields.year ||
    finalParts.month !== fields.month ||
    finalParts.day !== fields.day ||
    finalParts.hour !== fields.hour ||
    finalParts.minute !== fields.minute
  ) {
    throw new ReminderValidationError(
      "O horário informado não existe nesse fuso horário."
    );
  }

  return candidateTimestamp;
}

export function reminderToDate(value: ReminderDateFields): Date {
  return new Date(zonedDateTimeToTimestamp(parseReminderDateFields(value)));
}

function normalizeReminderInput(value: unknown): ReminderInput {
  if (!isRecord(value)) {
    throw new ReminderValidationError("Preencha os dados do lembrete.");
  }

  if (typeof value.title !== "string" || !value.title.trim()) {
    throw new ReminderValidationError("Informe um título para o lembrete.");
  }

  const title = value.title.trim();

  if (title.length > MAX_TITLE_LENGTH) {
    throw new ReminderValidationError(
      `O título pode ter no máximo ${MAX_TITLE_LENGTH} caracteres.`
    );
  }

  const dateFields = parseReminderDateFields(value);
  const repeat = value.repeat === undefined ? "none" : value.repeat;

  if (typeof repeat !== "string" || !REMINDER_REPEATS.has(repeat as ReminderRepeat)) {
    throw new ReminderValidationError("A repetição informada é inválida.");
  }

  const emoji = value.emoji === undefined ? DEFAULT_REMINDER_EMOJI : value.emoji;

  if (typeof emoji !== "string" || !emoji.trim()) {
    throw new ReminderValidationError("O ícone do lembrete é inválido.");
  }

  let notes: string | undefined;

  if (value.notes !== undefined) {
    if (typeof value.notes !== "string") {
      throw new ReminderValidationError("As observações do lembrete são inválidas.");
    }

    notes = value.notes.trim() || undefined;

    if (notes && notes.length > MAX_NOTES_LENGTH) {
      throw new ReminderValidationError(
        `As observações podem ter no máximo ${MAX_NOTES_LENGTH} caracteres.`
      );
    }
  }

  return {
    title,
    day: String(dateFields.day).padStart(2, "0"),
    month: String(dateFields.month).padStart(2, "0"),
    year: String(dateFields.year).padStart(4, "0"),
    hour: String(dateFields.hour).padStart(2, "0"),
    minute: String(dateFields.minute).padStart(2, "0"),
    emoji: emoji.trim(),
    ...(notes ? { notes } : {}),
    repeat: repeat as ReminderRepeat,
    timezone: dateFields.timezone,
  };
}

export function validateReminderInput(
  value: unknown,
  options: ValidateReminderInputOptions = {}
): ReminderInput {
  const normalizedInput = normalizeReminderInput(value);
  const now = options.now ?? new Date();

  if (Number.isNaN(now.getTime())) {
    throw new ReminderValidationError("A data de referência é inválida.");
  }

  if (
    options.requireFuture !== false &&
    reminderToDate(normalizedInput).getTime() <= now.getTime()
  ) {
    throw new ReminderValidationError(
      "O lembrete precisa ser agendado para uma data e um horário futuros."
    );
  }

  return normalizedInput;
}

export function isValidReminderInput(
  value: unknown,
  options: ValidateReminderInputOptions = {}
): value is ReminderInput {
  try {
    validateReminderInput(value, options);
    return true;
  } catch {
    return false;
  }
}

function isStrictIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
}

function parseStoredReminder(value: unknown): Reminder | null {
  if (!isRecord(value)) {
    return null;
  }

  let normalizedInput: ReminderInput;

  try {
    normalizedInput = validateReminderInput(value, { requireFuture: false });
  } catch {
    return null;
  }

  if (
    typeof value.id !== "string" ||
    !value.id.trim() ||
    value.id !== value.id.trim() ||
    value.title !== normalizedInput.title ||
    value.day !== normalizedInput.day ||
    value.month !== normalizedInput.month ||
    value.year !== normalizedInput.year ||
    value.hour !== normalizedInput.hour ||
    value.minute !== normalizedInput.minute ||
    value.emoji !== normalizedInput.emoji ||
    value.notes !== normalizedInput.notes ||
    value.repeat !== normalizedInput.repeat ||
    value.timezone !== normalizedInput.timezone ||
    !(
      value.notificationId === null ||
      (typeof value.notificationId === "string" && value.notificationId.length > 0)
    ) ||
    !isStrictIsoTimestamp(value.createdAt) ||
    !isStrictIsoTimestamp(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt)
  ) {
    return null;
  }

  return {
    id: value.id,
    ...normalizedInput,
    emoji: normalizedInput.emoji ?? DEFAULT_REMINDER_EMOJI,
    repeat: normalizedInput.repeat ?? "none",
    timezone: normalizedInput.timezone ?? getDeviceTimezone(),
    notificationId: value.notificationId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

function migrateLegacyReminder(value: unknown, migratedAt: string): Reminder {
  const alreadyCurrent = parseStoredReminder(value);

  if (alreadyCurrent) {
    return alreadyCurrent;
  }

  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !value.id.trim() ||
    value.id !== value.id.trim() ||
    typeof value.emoji !== "string" ||
    (value.notes !== undefined && typeof value.notes !== "string")
  ) {
    throw new ReminderStorageError(
      "Um lembrete antigo salvo neste aparelho está incompleto ou inválido."
    );
  }

  let normalizedInput: ReminderInput;

  try {
    normalizedInput = validateReminderInput(
      {
        title: value.title,
        day: value.day,
        month: value.month,
        year: value.year,
        hour: value.hour,
        minute: value.minute,
        emoji: value.emoji,
        notes: value.notes,
        repeat: "none",
        timezone: getDeviceTimezone(),
      },
      { requireFuture: false }
    );
  } catch (error) {
    throw new ReminderStorageError(
      "Um lembrete antigo salvo neste aparelho possui uma data ou um horário inválido.",
      error
    );
  }

  return {
    id: value.id,
    ...normalizedInput,
    emoji: normalizedInput.emoji ?? DEFAULT_REMINDER_EMOJI,
    repeat: normalizedInput.repeat ?? "none",
    timezone: normalizedInput.timezone ?? getDeviceTimezone(),
    notificationId: null,
    createdAt: migratedAt,
    updatedAt: migratedAt,
  };
}

function ensureUniqueIds(reminders: Reminder[]): void {
  if (new Set(reminders.map((reminder) => reminder.id)).size !== reminders.length) {
    throw new ReminderStorageError(
      "Existem lembretes duplicados nos dados salvos neste aparelho."
    );
  }
}

export function sortRemindersChronologically(reminders: Reminder[]): Reminder[] {
  return cloneReminders(reminders).sort((first, second) => {
    const timeDifference =
      reminderToDate(first).getTime() - reminderToDate(second).getTime();

    return timeDifference || first.createdAt.localeCompare(second.createdAt);
  });
}

function parseCurrentStorage(storedValue: string): Reminder[] {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(storedValue);
  } catch (error) {
    throw new ReminderStorageError(undefined, error);
  }

  if (!isRecord(parsedValue)) {
    throw new ReminderStorageError();
  }

  if (parsedValue.version !== REMINDERS_SCHEMA_VERSION) {
    throw new ReminderStorageError(
      "A versão dos lembretes salvos não é compatível com este aplicativo."
    );
  }

  if (!Array.isArray(parsedValue.reminders)) {
    throw new ReminderStorageError();
  }

  const reminders = parsedValue.reminders.map(parseStoredReminder);

  if (reminders.some((reminder) => reminder === null)) {
    throw new ReminderStorageError();
  }

  const validReminders = reminders as Reminder[];
  ensureUniqueIds(validReminders);
  return sortRemindersChronologically(validReminders);
}

function parseLegacyStorage(storedValue: string): Reminder[] {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(storedValue);
  } catch (error) {
    throw new ReminderStorageError(
      "Os lembretes antigos salvos neste aparelho não puderam ser lidos.",
      error
    );
  }

  if (!Array.isArray(parsedValue)) {
    throw new ReminderStorageError(
      "Os lembretes antigos salvos neste aparelho estão em um formato inválido."
    );
  }

  const isOldDemonstrationReminder = (value: unknown) => {
    if (!isRecord(value)) return false;

    return (
      (value.id === "1" &&
        value.title === "Papanicolau" &&
        value.day === "22" &&
        value.month === "03" &&
        value.year === "2026" &&
        value.hour === "14" &&
        value.minute === "00" &&
        value.notes === "Clínica Dr. Silva") ||
      (value.id === "2" &&
        value.title === "Ginecologista - Dra. Ana" &&
        value.day === "05" &&
        value.month === "04" &&
        value.year === "2026" &&
        value.hour === "09" &&
        value.minute === "30" &&
        value.notes === "Consulta de rotina")
    );
  };

  const migratedAt = new Date().toISOString();
  const reminders = parsedValue
    .filter((value) => !isOldDemonstrationReminder(value))
    .map((value) =>
    migrateLegacyReminder(value, migratedAt)
  );
  ensureUniqueIds(reminders);
  return sortRemindersChronologically(reminders);
}

async function persistRemindersUnsafe(reminders: Reminder[]): Promise<void> {
  const validReminders = reminders.map(parseStoredReminder);

  if (validReminders.some((reminder) => reminder === null)) {
    throw new ReminderStorageError(
      "Não foi possível salvar um lembrete com dados inválidos."
    );
  }

  const normalizedReminders = sortRemindersChronologically(
    validReminders as Reminder[]
  );
  ensureUniqueIds(normalizedReminders);

  const storage: RemindersStorageV1 = {
    version: REMINDERS_SCHEMA_VERSION,
    reminders: normalizedReminders,
  };

  try {
    await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(storage));
  } catch (error) {
    throw new ReminderStorageError(
      "Não foi possível salvar os lembretes neste aparelho.",
      error
    );
  }
}

async function readRemindersUnsafe(): Promise<Reminder[]> {
  let currentValue: string | null;

  try {
    currentValue = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
  } catch (error) {
    throw new ReminderStorageError(
      "Não foi possível acessar os lembretes salvos neste aparelho.",
      error
    );
  }

  if (currentValue !== null) {
    return parseCurrentStorage(currentValue);
  }

  let legacyValue: string | null;

  try {
    legacyValue = await AsyncStorage.getItem(LEGACY_REMINDERS_STORAGE_KEY);
  } catch (error) {
    throw new ReminderStorageError(
      "Não foi possível acessar os lembretes antigos salvos neste aparelho.",
      error
    );
  }

  if (legacyValue === null) {
    return [];
  }

  const migratedReminders = parseLegacyStorage(legacyValue);
  // O valor legado é mantido intacto. Assim uma falha de migração ou um
  // downgrade não elimina a única cópia dos dados da pessoa usuária.
  await persistRemindersUnsafe(migratedReminders);
  return migratedReminders;
}

export async function loadReminders(): Promise<Reminder[]> {
  return enqueueReminderOperation(async () =>
    cloneReminders(await readRemindersUnsafe())
  );
}

function isNativeNotificationEnvironment(): boolean {
  return (
    Platform.OS !== "web" &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient
  );
}

export function getReminderNotificationStatus(): ReminderNotificationStatus {
  if (!isNativeNotificationEnvironment()) {
    lastReminderNotificationStatus = "unsupported";
  }

  return lastReminderNotificationStatus;
}

function permissionAllowsNotifications(
  permission: Notifications.NotificationPermissionsStatus
): boolean {
  return (
    permission.granted ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    permission.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

export async function ensureNotificationSchedulingAvailable(): Promise<ReminderNotificationStatus> {
  if (!isNativeNotificationEnvironment()) {
    lastReminderNotificationStatus = "unsupported";
    return lastReminderNotificationStatus;
  }

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync(
        REMINDER_NOTIFICATION_CHANNEL_ID,
        {
          name: "Lembretes de compromissos",
          description: "Avisos de consultas e compromissos de saúde",
          importance: Notifications.AndroidImportance.HIGH,
          sound: "default",
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#EC4899",
          enableLights: true,
        }
      );
    }

    let permission = await Notifications.getPermissionsAsync();

    if (!permissionAllowsNotifications(permission)) {
      permission = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
    }

    lastReminderNotificationStatus = permissionAllowsNotifications(permission)
      ? "available"
      : "permission-denied";
    return lastReminderNotificationStatus;
  } catch (error) {
    throw new ReminderNotificationError(
      "Não foi possível verificar a permissão de notificações.",
      error
    );
  }
}

function createNotificationTrigger(
  reminder: Reminder
): Notifications.SchedulableNotificationTriggerInput {
  const hour = Number(reminder.hour);
  const minute = Number(reminder.minute);
  const channel =
    Platform.OS === "android"
      ? { channelId: REMINDER_NOTIFICATION_CHANNEL_ID }
      : {};

  switch (reminder.repeat) {
    case "daily":
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...channel,
      };
    case "weekly": {
      const weekday =
        new Date(
          Date.UTC(
            Number(reminder.year),
            Number(reminder.month) - 1,
            Number(reminder.day)
          )
        ).getUTCDay() + 1;
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour,
        minute,
        ...channel,
      };
    }
    case "monthly":
      return {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: Number(reminder.day),
        hour,
        minute,
        ...channel,
      };
    case "yearly":
      return {
        type: Notifications.SchedulableTriggerInputTypes.YEARLY,
        day: Number(reminder.day),
        month: Number(reminder.month) - 1,
        hour,
        minute,
        ...channel,
      };
    case "none":
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderToDate(reminder),
        ...channel,
      };
  }
}

async function scheduleNativeReminder(
  reminder: Reminder,
  knownStatus?: ReminderNotificationStatus,
  enforceFirstOccurrence = false
): Promise<SchedulingResult> {
  const status = knownStatus ?? (await ensureNotificationSchedulingAvailable());

  if (status !== "available") {
    return { notificationId: null, status };
  }

  const trigger = createNotificationTrigger(reminder);

  try {
    const nextTriggerDate = await Notifications.getNextTriggerDateAsync(trigger);

    if (nextTriggerDate === null || nextTriggerDate <= Date.now()) {
      throw new ReminderValidationError(
        "A notificação precisa ter uma próxima ocorrência futura."
      );
    }

    if (
      enforceFirstOccurrence &&
      reminder.repeat !== "none" &&
      Math.abs(nextTriggerDate - reminderToDate(reminder).getTime()) >= 60_000
    ) {
      throw new ReminderValidationError(
        "Para um lembrete repetido, a data deve ser a próxima ocorrência desse horário."
      );
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Você tem um lembrete",
        body: "Abra o Saúde Feminina para ver os detalhes.",
        sound: "default",
        data: {
          type: "appointment-reminder",
          reminderId: reminder.id,
        },
      },
      trigger,
    });

    if (!notificationId) {
      throw new Error("O sistema não retornou o identificador da notificação.");
    }

    return { notificationId, status };
  } catch (error) {
    if (error instanceof ReminderValidationError) {
      throw error;
    }

    throw new ReminderNotificationError(undefined, error);
  }
}

async function cancelNativeReminder(notificationId: string): Promise<boolean> {
  if (!isNativeNotificationEnvironment()) {
    return false;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    return true;
  } catch (error) {
    throw new ReminderNotificationError(
      "Não foi possível cancelar a notificação anterior deste lembrete.",
      error
    );
  }
}

async function cancelForRollback(notificationId: string | null): Promise<void> {
  if (!notificationId) {
    return;
  }

  try {
    await cancelNativeReminder(notificationId);
  } catch (error) {
    console.warn("Falha ao desfazer um agendamento de lembrete.", error);
  }
}

function createReminderId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildReminder(input: ReminderInput, timestamp: string): Reminder {
  return {
    id: createReminderId(),
    ...input,
    emoji: input.emoji ?? DEFAULT_REMINDER_EMOJI,
    repeat: input.repeat ?? "none",
    timezone: input.timezone ?? getDeviceTimezone(),
    notificationId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function createReminder(value: unknown): Promise<Reminder> {
  return enqueueReminderOperation(async () => {
    const input = validateReminderInput(value);
    const currentReminders = await readRemindersUnsafe();
    const preferences = await loadNotificationPreferencesFromStore();
    const timestamp = new Date().toISOString();
    let reminder = buildReminder(input, timestamp);

    const baseId = reminder.id;
    let collisionSuffix = 1;

    while (currentReminders.some((current) => current.id === reminder.id)) {
      reminder = { ...reminder, id: `${baseId}-${collisionSuffix}` };
      collisionSuffix += 1;
    }

    if (preferences.appointmentReminders) {
      const scheduling = await scheduleNativeReminder(
        reminder,
        undefined,
        true
      );
      reminder = { ...reminder, notificationId: scheduling.notificationId };
    }

    try {
      await persistRemindersUnsafe([...currentReminders, reminder]);
    } catch (error) {
      await cancelForRollback(reminder.notificationId);
      throw error;
    }

    return cloneReminder(reminder);
  });
}

function editableFieldsFromReminder(reminder: Reminder): ReminderInput {
  return {
    title: reminder.title,
    day: reminder.day,
    month: reminder.month,
    year: reminder.year,
    hour: reminder.hour,
    minute: reminder.minute,
    emoji: reminder.emoji,
    ...(reminder.notes ? { notes: reminder.notes } : {}),
    repeat: reminder.repeat,
    timezone: reminder.timezone,
  };
}

async function tryRestoreReminderAfterFailedMutation(
  originalReminders: Reminder[],
  reminderIndex: number,
  originalReminder: Reminder
): Promise<void> {
  if (!originalReminder.notificationId) {
    return;
  }

  try {
    const scheduling = await scheduleNativeReminder(originalReminder);

    if (scheduling.notificationId) {
      const repairedReminders = cloneReminders(originalReminders);
      repairedReminders[reminderIndex] = {
        ...originalReminder,
        notificationId: scheduling.notificationId,
      };
      await persistRemindersUnsafe(repairedReminders);
    }
  } catch (error) {
    console.warn("Falha ao restaurar uma notificação após erro de persistência.", error);
  }
}

export async function updateReminder(
  reminderId: string,
  updates: ReminderUpdateInput
): Promise<Reminder> {
  return enqueueReminderOperation(async () => {
    const currentReminders = await readRemindersUnsafe();
    const reminderIndex = currentReminders.findIndex(
      (reminder) => reminder.id === reminderId
    );

    if (reminderIndex < 0) {
      throw new ReminderNotFoundError();
    }

    if (!isRecord(updates)) {
      throw new ReminderValidationError("As alterações do lembrete são inválidas.");
    }

    const currentReminder = currentReminders[reminderIndex];
    const input = validateReminderInput({
      ...editableFieldsFromReminder(currentReminder),
      ...updates,
    }, { requireFuture: false });

    if (
      input.repeat === "none" &&
      reminderToDate(input).getTime() <= Date.now()
    ) {
      throw new ReminderValidationError(
        "O lembrete precisa ser agendado para uma data e um horário futuros."
      );
    }
    const preferences = await loadNotificationPreferencesFromStore();
    let updatedReminder: Reminder = {
      ...currentReminder,
      ...input,
      emoji: input.emoji ?? DEFAULT_REMINDER_EMOJI,
      repeat: input.repeat ?? "none",
      timezone: input.timezone ?? getDeviceTimezone(),
      notificationId: null,
      updatedAt: new Date().toISOString(),
    };

    if (preferences.appointmentReminders) {
      const scheduling = await scheduleNativeReminder(
        updatedReminder,
        undefined,
        reminderToDate(updatedReminder).getTime() > Date.now()
      );
      updatedReminder = {
        ...updatedReminder,
        notificationId: scheduling.notificationId,
      };
    }

    try {
      if (currentReminder.notificationId) {
        await cancelNativeReminder(currentReminder.notificationId);
      }
    } catch (error) {
      await cancelForRollback(updatedReminder.notificationId);
      throw error;
    }

    const nextReminders = cloneReminders(currentReminders);
    nextReminders[reminderIndex] = updatedReminder;

    try {
      await persistRemindersUnsafe(nextReminders);
    } catch (error) {
      await cancelForRollback(updatedReminder.notificationId);
      await tryRestoreReminderAfterFailedMutation(
        currentReminders,
        reminderIndex,
        currentReminder
      );
      throw error;
    }

    return cloneReminder(updatedReminder);
  });
}

export async function deleteReminder(reminderId: string): Promise<void> {
  return enqueueReminderOperation(async () => {
    const currentReminders = await readRemindersUnsafe();
    const reminderIndex = currentReminders.findIndex(
      (reminder) => reminder.id === reminderId
    );

    if (reminderIndex < 0) {
      throw new ReminderNotFoundError();
    }

    const reminder = currentReminders[reminderIndex];

    if (reminder.notificationId) {
      await cancelNativeReminder(reminder.notificationId);
    }

    try {
      await persistRemindersUnsafe(
        currentReminders.filter((current) => current.id !== reminderId)
      );
    } catch (error) {
      await tryRestoreReminderAfterFailedMutation(
        currentReminders,
        reminderIndex,
        reminder
      );
      throw error;
    }
  });
}

function shouldHaveScheduledNotification(reminder: Reminder): boolean {
  return (
    reminder.repeat !== "none" || reminderToDate(reminder).getTime() > Date.now()
  );
}

async function reconcileReminderNotificationsUnsafe(
  enabled: boolean
): Promise<ReminderNotificationSyncResult> {
  const reminders = await readRemindersUnsafe();
  const environmentStatus = getReminderNotificationStatus();
  const hasFutureNotification = reminders.some(
    shouldHaveScheduledNotification
  );
  const schedulingStatus = enabled && hasFutureNotification
    ? await ensureNotificationSchedulingAvailable()
    : environmentStatus;
  let scheduledCount = 0;
  let cancelledCount = 0;
  const nextReminders: Reminder[] = [];
  const newNotificationIds: string[] = [];
  const cancelledOriginalIndexes: number[] = [];

  try {
    for (const [reminderIndex, reminder] of reminders.entries()) {
      let notificationId: string | null = null;

      if (
        enabled &&
        schedulingStatus === "available" &&
        shouldHaveScheduledNotification(reminder)
      ) {
        const scheduling = await scheduleNativeReminder(
          reminder,
          schedulingStatus,
          reminderToDate(reminder).getTime() > Date.now()
        );
        notificationId = scheduling.notificationId;

        if (notificationId) {
          scheduledCount += 1;
          newNotificationIds.push(notificationId);
        }
      }

      if (reminder.notificationId) {
        const cancelledNatively = await cancelNativeReminder(
          reminder.notificationId
        );

        if (cancelledNatively) {
          cancelledOriginalIndexes.push(reminderIndex);
        }
        cancelledCount += 1;
      }

      nextReminders.push({ ...reminder, notificationId });
    }

    const changed = nextReminders.some(
      (reminder, index) =>
        reminder.notificationId !== reminders[index].notificationId
    );

    if (changed) {
      await persistRemindersUnsafe(nextReminders);
    }
  } catch (error) {
    await Promise.all(newNotificationIds.map(cancelForRollback));

    if (cancelledOriginalIndexes.length > 0) {
      try {
        const restorationStatus = await ensureNotificationSchedulingAvailable();
        const repairedReminders = cloneReminders(reminders);
        let hasRepair = false;

        if (restorationStatus === "available") {
          for (const reminderIndex of cancelledOriginalIndexes) {
            const originalReminder = reminders[reminderIndex];

            if (!shouldHaveScheduledNotification(originalReminder)) {
              continue;
            }

            const restored = await scheduleNativeReminder(
              originalReminder,
              restorationStatus
            );

            if (restored.notificationId) {
              repairedReminders[reminderIndex] = {
                ...originalReminder,
                notificationId: restored.notificationId,
              };
              hasRepair = true;
            }
          }
        }

        if (hasRepair) {
          await persistRemindersUnsafe(repairedReminders);
        }
      } catch (restoreError) {
        console.warn(
          "Falha ao restaurar os agendamentos após uma sincronização incompleta.",
          restoreError
        );
      }
    }

    throw error;
  }

  return {
    reminders: cloneReminders(nextReminders),
    status: schedulingStatus,
    scheduledCount,
    cancelledCount,
  };
}

export async function setReminderNotificationsEnabled(
  enabled: boolean
): Promise<ReminderNotificationSyncResult> {
  if (typeof enabled !== "boolean") {
    throw new ReminderValidationError(
      "O estado das notificações de lembrete é inválido."
    );
  }

  return enqueueReminderOperation(async () =>
    reconcileReminderNotificationsUnsafe(enabled)
  );
}

export async function syncReminderNotifications(): Promise<ReminderNotificationSyncResult> {
  return enqueueReminderOperation(async () => {
    const preferences = await loadNotificationPreferencesFromStore();
    return reconcileReminderNotificationsUnsafe(
      preferences.appointmentReminders
    );
  });
}

export function remindersNeedNotificationSync(
  reminders: Reminder[],
  enabled: boolean
): boolean {
  return enabled
    ? reminders.some(
        (reminder) =>
          shouldHaveScheduledNotification(reminder) &&
          reminder.notificationId === null
      )
    : reminders.some((reminder) => reminder.notificationId !== null);
}
