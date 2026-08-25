import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CYCLE_VARIABILITY_MESSAGE,
  dailyMessages,
  MENSTRUAL_PAIN_GUIDANCE_MESSAGE,
} from "../data/dailyMessages";

export const DAILY_MESSAGE_STORAGE_KEY =
  "@saudeFeminina:dailyMessage:v1";
export const DAILY_MESSAGE_STORAGE_VERSION = 1 as const;

const LEGACY_STORAGE_KEYS = {
  date: "dailyMessageDate",
  message: "dailyMessage",
  icon: "dailyMessageIcon",
  colors: "dailyMessageColors",
} as const;

const DAILY_MESSAGE_ICONS = ["💝", "🌸", "✨", "🌙", "💕", "🦋", "🌺", "💫"] as const;

const DAILY_MESSAGE_COLOR_SCHEMES = [
  ["#b45309", "#be123c", "#6b21a8"],
  ["#be185d", "#c2410c", "#6d28d9"],
  ["#0e7490", "#1d4ed8", "#6d28d9"],
  ["#047857", "#b45309", "#b91c1c"],
  ["#7e22ce", "#be185d", "#0e7490"],
  ["#c2410c", "#047857", "#1d4ed8"],
] as const;

const LEGACY_MESSAGE_REPLACEMENTS = new Map<string, string>([
  [
    "A dor menstrual não é normal. Busque ajuda se precisar.",
    MENSTRUAL_PAIN_GUIDANCE_MESSAGE,
  ],
  [
    "Seu ciclo menstrual é um relógio biológico preciso. Aprenda a lê-lo.",
    CYCLE_VARIABILITY_MESSAGE,
  ],
]);

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface DailyMessageRecord {
  version: typeof DAILY_MESSAGE_STORAGE_VERSION;
  date: string;
  message: string;
  icon: string;
  colors: string[];
}

export interface GetTodayDailyMessageOptions {
  forceRefresh?: boolean;
  now?: Date;
  random?: () => number;
}

export class DailyMessageStorageError extends Error {
  constructor(message = "A mensagem diária salva está em um formato inválido.") {
    super(message);
    this.name = "DailyMessageStorageError";
  }
}

let operationQueue: Promise<void> = Promise.resolve();

function runExclusive<T>(operation: () => Promise<T>) {
  const result = operationQueue.then(operation, operation);
  operationQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDate(date: Date) {
  return !Number.isNaN(date.getTime());
}

function isValidLocalDateKey(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const match = LOCAL_DATE_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidColors(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    value.every((color) => isNonEmptyString(color))
  );
}

function isDailyMessageRecord(value: unknown): value is DailyMessageRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<DailyMessageRecord>;

  return (
    record.version === DAILY_MESSAGE_STORAGE_VERSION &&
    isValidLocalDateKey(record.date) &&
    isNonEmptyString(record.message) &&
    isNonEmptyString(record.icon) &&
    isValidColors(record.colors)
  );
}

function normalizeMessage(message: string) {
  const replacedMessage = LEGACY_MESSAGE_REPLACEMENTS.get(message) ?? message;
  return dailyMessages.includes(replacedMessage)
    ? replacedMessage
    : dailyMessages[0];
}

function normalizeColors(colors: string[]) {
  const knownScheme = DAILY_MESSAGE_COLOR_SCHEMES.find(
    (scheme) =>
      scheme.length === colors.length &&
      scheme.every((color, index) => color === colors[index]),
  );

  return knownScheme
    ? [...knownScheme]
    : [...DAILY_MESSAGE_COLOR_SCHEMES[0]];
}

function cloneRecord(record: DailyMessageRecord): DailyMessageRecord {
  return {
    ...record,
    colors: [...record.colors],
  };
}

function parseStoredRecord(storedValue: string) {
  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(storedValue);
  } catch {
    throw new DailyMessageStorageError();
  }

  if (!isDailyMessageRecord(parsedValue)) {
    throw new DailyMessageStorageError();
  }

  return cloneRecord(parsedValue);
}

function normalizeLegacyDate(value: string | null, fallbackDate: Date) {
  if (isValidLocalDateKey(value)) {
    return value;
  }

  if (value) {
    const parsedDate = new Date(value);

    if (isValidDate(parsedDate)) {
      return toLocalDateKey(parsedDate);
    }
  }

  return toLocalDateKey(fallbackDate);
}

function parseLegacyColors(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsedValue: unknown = JSON.parse(value);
    return isValidColors(parsedValue) ? [...parsedValue] : null;
  } catch {
    return null;
  }
}

function normalizeRandomValue(random: () => number) {
  const value = random();

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1 - Number.EPSILON);
}

function pickRandom<T>(values: readonly T[], random: () => number) {
  return values[Math.floor(normalizeRandomValue(random) * values.length)];
}

function createDailyMessageRecord(
  date: Date,
  random: () => number
): DailyMessageRecord {
  return {
    version: DAILY_MESSAGE_STORAGE_VERSION,
    date: toLocalDateKey(date),
    message: pickRandom(dailyMessages, random),
    icon: pickRandom(DAILY_MESSAGE_ICONS, random),
    colors: [...pickRandom(DAILY_MESSAGE_COLOR_SCHEMES, random)],
  };
}

async function persistDailyMessage(record: DailyMessageRecord) {
  if (!isDailyMessageRecord(record)) {
    throw new DailyMessageStorageError();
  }

  // Uma única escrita contém todo o estado; o chamador só prossegue após ela.
  await AsyncStorage.setItem(DAILY_MESSAGE_STORAGE_KEY, JSON.stringify(record));
}

async function migrateLegacyDailyMessage(fallbackDate: Date) {
  const legacyKeys = Object.values(LEGACY_STORAGE_KEYS);
  const legacyEntries = await AsyncStorage.multiGet(legacyKeys);

  if (legacyEntries.every(([, value]) => value === null)) {
    return null;
  }

  const legacyValues = new Map(legacyEntries);
  const legacyMessage = legacyValues.get(LEGACY_STORAGE_KEYS.message);
  const legacyIcon = legacyValues.get(LEGACY_STORAGE_KEYS.icon);
  const legacyColors = parseLegacyColors(
    legacyValues.get(LEGACY_STORAGE_KEYS.colors) ?? null
  );

  const migratedRecord: DailyMessageRecord = {
    version: DAILY_MESSAGE_STORAGE_VERSION,
    date: normalizeLegacyDate(
      legacyValues.get(LEGACY_STORAGE_KEYS.date) ?? null,
      fallbackDate
    ),
    message: normalizeMessage(
      isNonEmptyString(legacyMessage) ? legacyMessage : dailyMessages[0]
    ),
    icon: isNonEmptyString(legacyIcon) ? legacyIcon : DAILY_MESSAGE_ICONS[0],
    colors: normalizeColors(
      legacyColors ?? [...DAILY_MESSAGE_COLOR_SCHEMES[0]],
    ),
  };

  await persistDailyMessage(migratedRecord);

  try {
    await AsyncStorage.multiRemove(legacyKeys);
  } catch {
    // O JSON canônico já foi confirmado; manter as chaves antigas não perde dados.
  }

  return migratedRecord;
}

async function loadDailyMessageInternal(fallbackDate: Date) {
  const storedValue = await AsyncStorage.getItem(DAILY_MESSAGE_STORAGE_KEY);

  if (storedValue === null) {
    return migrateLegacyDailyMessage(fallbackDate);
  }

  const storedRecord = parseStoredRecord(storedValue);
  const normalizedMessage = normalizeMessage(storedRecord.message);
  const normalizedColors = normalizeColors(storedRecord.colors);

  if (
    normalizedMessage !== storedRecord.message ||
    normalizedColors.some((color, index) => color !== storedRecord.colors[index])
  ) {
    const normalizedRecord = {
      ...storedRecord,
      message: normalizedMessage,
      colors: normalizedColors,
    };
    await persistDailyMessage(normalizedRecord);
    return normalizedRecord;
  }

  return storedRecord;
}

/** Carrega e valida o JSON atual, migrando as quatro chaves antigas se preciso. */
export function loadDailyMessage() {
  return runExclusive(() => loadDailyMessageInternal(new Date()));
}

/**
 * Retorna a mensagem do dia local. Uma nova seleção é persistida quando a data
 * muda ou quando `forceRefresh` é solicitado.
 */
export function getTodayDailyMessage(
  options: GetTodayDailyMessageOptions = {}
) {
  return runExclusive(async () => {
    const now = options.now ?? new Date();

    if (!isValidDate(now)) {
      throw new DailyMessageStorageError("A data informada é inválida.");
    }

    const storedRecord = await loadDailyMessageInternal(now);
    const today = toLocalDateKey(now);

    if (!options.forceRefresh && storedRecord?.date === today) {
      return cloneRecord(storedRecord);
    }

    const nextRecord = createDailyMessageRecord(
      now,
      options.random ?? Math.random
    );
    await persistDailyMessage(nextRecord);
    return cloneRecord(nextRecord);
  });
}
