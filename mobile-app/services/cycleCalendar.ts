import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  CalendarNote,
  CALENDAR_NOTES_STORAGE_KEY,
} from "./calendarNotes";
import {
  compareLocalDates,
  daysBetween,
  isValidLocalDate,
  MAX_RECORDED_PERIOD_DAYS,
  MENSTRUAL_CYCLES_STORAGE_KEY,
  MenstrualCycleRecord,
  rangesOverlap,
} from "./menstrualCycle";
import {
  CYCLE_CALENDAR_SCHEMA_VERSION,
  CycleCalendarState,
  CycleContextFactorsUpdate,
  CycleNoteRecord,
  CyclePeriodRecord,
  CycleTrackingSettings,
  DailyCycleEntry,
  DailyCycleEntryUpdate,
  SexualActivityInput,
  SexualActivityRecord,
} from "../types/cycleCalendar";
import {
  DEFAULT_CYCLE_CONTEXT_FACTORS,
  DEFAULT_CYCLE_TRACKING_SETTINGS,
} from "./cyclePrediction";

export const CYCLE_CALENDAR_STORAGE_KEY =
  "@saudeFeminina:cycleCalendar:v2";

const MAX_NOTE_LENGTH = 5_000;
const MAX_MEDICATION_LENGTH = 120;
const MAX_SEXUAL_ACTIVITY_NOTE_LENGTH = 1_000;

export class CycleCalendarStorageError extends Error {
  constructor(message = "Os dados do calendario estao em um formato invalido.") {
    super(message);
    this.name = "CycleCalendarStorageError";
  }
}

export class CycleCalendarValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CycleCalendarValidationError";
  }
}

type UnknownRecord = Record<string, unknown>;

let writeQueue: Promise<unknown> = Promise.resolve();

function isObject(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createId(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
}

function validIsoDate(value: unknown, fallback: string) {
  return typeof value === "string" && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : fallback;
}

function dateBasedIso(date: string) {
  return `${date}T12:00:00.000Z`;
}

function normalizeStringArray(value: unknown, maxLength = 120) {
  if (!Array.isArray(value)) return [];
  return [...new Set(
    value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().slice(0, maxLength))
      .filter(Boolean),
  )];
}

function normalizePeriod(value: unknown, now: string): CyclePeriodRecord | null {
  if (!isObject(value)) return null;
  const startDate = value.startDate;
  const endDate = value.endDate;
  if (
    typeof value.id !== "string" ||
    !value.id ||
    !isValidLocalDate(startDate) ||
    !isValidLocalDate(endDate) ||
    compareLocalDates(startDate, endDate) > 0 ||
    daysBetween(startDate, endDate) + 1 > MAX_RECORDED_PERIOD_DAYS
  ) {
    return null;
  }
  const createdAt = validIsoDate(value.createdAt, now);
  return {
    id: value.id,
    startDate,
    endDate,
    createdAt,
    updatedAt: validIsoDate(value.updatedAt, createdAt),
    source: value.source === "cycle_calendar" ? "cycle_calendar" : "legacy",
  };
}

function normalizeSexualActivity(
  value: unknown,
  now: string,
): SexualActivityRecord | null {
  if (!isObject(value) || typeof value.id !== "string" || !value.id) return null;
  if (value.kind !== "vaginal" && value.kind !== "other") return null;
  const protection = [
    "not_reported",
    "none",
    "condom",
    "condom_failure",
    "other_contraception",
  ].includes(String(value.protection))
    ? (value.protection as SexualActivityRecord["protection"])
    : "not_reported";
  const createdAt = validIsoDate(value.createdAt, now);
  return {
    id: value.id,
    kind: value.kind,
    protection,
    ejaculationExposure: ["yes", "no", "unknown"].includes(
      String(value.ejaculationExposure),
    )
      ? (value.ejaculationExposure as SexualActivityRecord["ejaculationExposure"])
      : undefined,
    tryingToConceive:
      typeof value.tryingToConceive === "boolean"
        ? value.tryingToConceive
        : undefined,
    note:
      typeof value.note === "string" && value.note.trim()
        ? value.note.trim().slice(0, MAX_SEXUAL_ACTIVITY_NOTE_LENGTH)
        : undefined,
    createdAt,
    updatedAt: validIsoDate(value.updatedAt, createdAt),
  };
}

function normalizeNote(value: unknown, now: string): CycleNoteRecord | null {
  if (!isObject(value) || typeof value.id !== "string" || !value.id) return null;
  const text = typeof value.text === "string" ? value.text.trim() : "";
  if (!text) return null;
  const createdAt = validIsoDate(value.createdAt, now);
  return {
    id: value.id,
    text: text.slice(0, MAX_NOTE_LENGTH),
    emoji:
      typeof value.emoji === "string" && value.emoji
        ? value.emoji.slice(0, 24)
        : "📝",
    symptoms: normalizeStringArray(value.symptoms),
    createdAt,
    updatedAt: validIsoDate(value.updatedAt, createdAt),
    source: value.source === "cycle_calendar" ? "cycle_calendar" : "legacy",
  };
}

function normalizeDailyEntry(value: unknown, now: string): DailyCycleEntry | null {
  if (!isObject(value) || !isValidLocalDate(value.date)) return null;
  const date = value.date;
  const createdAt = validIsoDate(value.createdAt, dateBasedIso(date));
  const symptoms = isObject(value.symptoms)
    ? Object.fromEntries(
        Object.entries(value.symptoms).filter(([, severity]) =>
          ["mild", "moderate", "severe"].includes(String(severity)),
        ),
      )
    : {};
  const fertility = isObject(value.fertility) ? value.fertility : {};
  const factors = isObject(value.factors) ? value.factors : {};
  const sexualActivities = Array.isArray(value.sexualActivities)
    ? value.sexualActivities
        .map((activity) => normalizeSexualActivity(activity, now))
        .filter((activity): activity is SexualActivityRecord => activity !== null)
    : [];
  const sexualActivityStatus = ["not_reported", "none", "activity"].includes(
    String(value.sexualActivityStatus),
  )
    ? (value.sexualActivityStatus as DailyCycleEntry["sexualActivityStatus"])
    : sexualActivities.length > 0
      ? "activity"
      : "not_reported";
  const scale = (field: unknown) =>
    typeof field === "number" && Number.isInteger(field) && field >= 1 && field <= 5
      ? (field as DailyCycleEntry["energy"])
      : undefined;
  return {
    id:
      typeof value.id === "string" && value.id
        ? value.id
        : `daily:${date}`,
    date,
    bleeding: ["spotting", "light", "medium", "heavy"].includes(
      String(value.bleeding),
    )
      ? (value.bleeding as DailyCycleEntry["bleeding"])
      : undefined,
    symptoms: symptoms as DailyCycleEntry["symptoms"],
    moods: normalizeStringArray(value.moods),
    energy: scale(value.energy),
    sleep: scale(value.sleep),
    libido: scale(value.libido),
    fertility: {
      cervicalMucus: ["dry", "sticky", "creamy", "watery", "egg_white"].includes(
        String(fertility.cervicalMucus),
      )
        ? (fertility.cervicalMucus as DailyCycleEntry["fertility"]["cervicalMucus"])
        : undefined,
      basalTemperatureCelsius:
        typeof fertility.basalTemperatureCelsius === "number" &&
        fertility.basalTemperatureCelsius >= 34 &&
        fertility.basalTemperatureCelsius <= 42
          ? Math.round(fertility.basalTemperatureCelsius * 100) / 100
          : undefined,
      basalTemperatureTime:
        typeof fertility.basalTemperatureTime === "string" &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(fertility.basalTemperatureTime)
          ? fertility.basalTemperatureTime
          : undefined,
      temperatureReliability: [
        "reliable",
        "poor_sleep",
        "different_time",
        "illness",
        "alcohol",
        "uncertain",
      ].includes(String(fertility.temperatureReliability))
        ? (fertility.temperatureReliability as DailyCycleEntry["fertility"]["temperatureReliability"])
        : undefined,
      ovulationTest: ["negative", "positive", "peak", "unclear"].includes(
        String(fertility.ovulationTest),
      )
        ? (fertility.ovulationTest as DailyCycleEntry["fertility"]["ovulationTest"])
        : undefined,
      pregnancyTest: ["negative", "positive", "unclear"].includes(
        String(fertility.pregnancyTest),
      )
        ? (fertility.pregnancyTest as DailyCycleEntry["fertility"]["pregnancyTest"])
        : undefined,
    },
    sexualActivityStatus,
    sexualActivities:
      sexualActivityStatus === "activity" ? sexualActivities : [],
    medications: normalizeStringArray(value.medications, MAX_MEDICATION_LENGTH),
    factors: {
      illness: typeof factors.illness === "boolean" ? factors.illness : undefined,
      fever: typeof factors.fever === "boolean" ? factors.fever : undefined,
      stress: ["low", "moderate", "high"].includes(String(factors.stress))
        ? (factors.stress as DailyCycleEntry["factors"]["stress"])
        : undefined,
      poorSleep:
        typeof factors.poorSleep === "boolean" ? factors.poorSleep : undefined,
      travel: typeof factors.travel === "boolean" ? factors.travel : undefined,
      medicationChange:
        typeof factors.medicationChange === "boolean"
          ? factors.medicationChange
          : undefined,
      emergencyContraception:
        typeof factors.emergencyContraception === "boolean"
          ? factors.emergencyContraception
          : undefined,
      contraceptiveAdherence: ["on_time", "late", "missed"].includes(
        String(factors.contraceptiveAdherence),
      )
        ? (factors.contraceptiveAdherence as DailyCycleEntry["factors"]["contraceptiveAdherence"])
        : undefined,
      notes:
        typeof factors.notes === "string" && factors.notes.trim()
          ? factors.notes.trim().slice(0, MAX_NOTE_LENGTH)
          : undefined,
    },
    notes: Array.isArray(value.notes)
      ? value.notes
          .map((note) => normalizeNote(note, now))
          .filter((note): note is CycleNoteRecord => note !== null)
      : [],
    createdAt,
    updatedAt: validIsoDate(value.updatedAt, createdAt),
  };
}

function normalizeSettings(value: unknown): CycleTrackingSettings {
  const settings = isObject(value) ? value : {};
  const goal = ["track_cycle", "trying_to_conceive", "track_fertility"].includes(
    String(settings.goal),
  )
    ? (settings.goal as CycleTrackingSettings["goal"])
    : DEFAULT_CYCLE_TRACKING_SETTINGS.goal;
  const notificationPrivacy = settings.notificationPrivacy === "detailed"
    ? "detailed"
    : "neutral";
  const ageGroup = ["teen", "adult", "not_reported"].includes(
    String(settings.ageGroup),
  )
    ? (settings.ageGroup as CycleTrackingSettings["ageGroup"])
    : "not_reported";
  return {
    goal,
    predictionsEnabled:
      typeof settings.predictionsEnabled === "boolean"
        ? settings.predictionsEnabled
        : true,
    fertilityEstimatesEnabled:
      typeof settings.fertilityEstimatesEnabled === "boolean"
        ? settings.fertilityEstimatesEnabled
        : true,
    showSexMarkers:
      typeof settings.showSexMarkers === "boolean"
        ? settings.showSexMarkers
        : false,
    notificationPrivacy,
    ageGroup,
    lookbackCycles:
      typeof settings.lookbackCycles === "number"
        ? Math.min(12, Math.max(3, Math.round(settings.lookbackCycles)))
        : 12,
  };
}

function normalizeFactors(value: unknown, now: string) {
  const factors = isObject(value) ? value : {};
  const contraceptiveMethod = [
    "not_reported",
    "none",
    "combined_pill",
    "progestin_pill",
    "hormonal_iud",
    "copper_iud",
    "implant",
    "injection",
    "patch",
    "ring",
    "condom",
    "other",
  ].includes(String(factors.contraceptiveMethod))
    ? (factors.contraceptiveMethod as CycleCalendarState["factors"]["contraceptiveMethod"])
    : "not_reported";
  return {
    contraceptiveMethod,
    usesHormonalContraception: factors.usesHormonalContraception === true,
    pregnant: factors.pregnant === true,
    postpartum: factors.postpartum === true,
    breastfeeding: factors.breastfeeding === true,
    perimenopause: factors.perimenopause === true,
    recentlyStoppedHormonalContraception:
      factors.recentlyStoppedHormonalContraception === true,
    updatedAt: validIsoDate(factors.updatedAt, now),
  };
}

export function createEmptyCycleCalendarState(
  now = new Date().toISOString(),
): CycleCalendarState {
  return {
    schemaVersion: CYCLE_CALENDAR_SCHEMA_VERSION,
    revision: 0,
    periods: [],
    entries: [],
    settings: { ...DEFAULT_CYCLE_TRACKING_SETTINGS },
    factors: { ...DEFAULT_CYCLE_CONTEXT_FACTORS, updatedAt: now },
    migration: {
      importedLegacyCycles: false,
      importedLegacyNotes: false,
      lastLegacySyncAt: null,
    },
    createdAt: now,
    updatedAt: now,
  };
}

/** Aceita o documento atual, o prototipo v1 e o formato sem versao. */
function migrateStoredState(value: unknown, now: string): CycleCalendarState {
  if (!isObject(value)) throw new CycleCalendarStorageError();
  const schemaVersion = Number(value.schemaVersion ?? value.version ?? 1);
  if (!Number.isInteger(schemaVersion) || schemaVersion > CYCLE_CALENDAR_SCHEMA_VERSION) {
    throw new CycleCalendarStorageError(
      "Os dados foram criados por uma versao mais nova do aplicativo.",
    );
  }
  const empty = createEmptyCycleCalendarState(now);
  const rawPeriods = Array.isArray(value.periods)
    ? value.periods
    : Array.isArray(value.cycles)
      ? value.cycles
      : [];
  const rawEntries = Array.isArray(value.entries)
    ? value.entries
    : Array.isArray(value.dailyEntries)
      ? value.dailyEntries
      : [];
  const periods = rawPeriods
    .map((period) => normalizePeriod(period, now))
    .filter((period): period is CyclePeriodRecord => period !== null);
  const entries = rawEntries
    .map((entry) => normalizeDailyEntry(entry, now))
    .filter((entry): entry is DailyCycleEntry => entry !== null);
  const migration = isObject(value.migration) ? value.migration : {};
  return {
    ...empty,
    revision:
      typeof value.revision === "number" && value.revision >= 0
        ? Math.floor(value.revision)
        : 0,
    periods: sortPeriods(periods),
    entries: sortEntries(entries),
    settings: normalizeSettings(value.settings),
    factors: normalizeFactors(value.factors, now),
    migration: {
      importedLegacyCycles: migration.importedLegacyCycles === true,
      importedLegacyNotes: migration.importedLegacyNotes === true,
      lastLegacySyncAt:
        typeof migration.lastLegacySyncAt === "string" &&
        Number.isFinite(Date.parse(migration.lastLegacySyncAt))
          ? new Date(migration.lastLegacySyncAt).toISOString()
          : null,
    },
    createdAt: validIsoDate(value.createdAt, now),
    updatedAt: validIsoDate(value.updatedAt, now),
  };
}

function sortPeriods(periods: CyclePeriodRecord[]) {
  return [...periods].sort((first, second) =>
    second.startDate.localeCompare(first.startDate),
  );
}

function sortEntries(entries: DailyCycleEntry[]) {
  return [...entries].sort((first, second) => second.date.localeCompare(first.date));
}

function parseJson(raw: string | null) {
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new CycleCalendarStorageError();
  }
}

function parseLegacyCycles(raw: string | null, now: string) {
  const parsed = parseJson(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((cycle) => normalizePeriod(cycle, now))
    .filter((cycle): cycle is CyclePeriodRecord => cycle !== null)
    .map((cycle) => ({ ...cycle, source: "legacy" as const }));
}

function parseLegacyNotes(raw: string | null) {
  const parsed = parseJson(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((value): value is CalendarNote => {
    if (!isObject(value)) return false;
    return (
      typeof value.id === "string" &&
      Boolean(value.id) &&
      isValidLocalDate(value.date) &&
      typeof value.note === "string" &&
      Boolean(value.note.trim())
    );
  });
}

function mergeLegacyCycles(
  state: CycleCalendarState,
  legacyCycles: CyclePeriodRecord[],
  authoritative = false,
) {
  const periodsById = new Map(state.periods.map((period) => [period.id, period]));
  for (const legacyCycle of legacyCycles) {
    const current = periodsById.get(legacyCycle.id);
    periodsById.set(legacyCycle.id, {
      ...current,
      ...legacyCycle,
      updatedAt: current?.updatedAt ?? legacyCycle.updatedAt,
      source: current?.source ?? "legacy",
    });
  }
  const periods = authoritative
    ? legacyCycles.map((legacyCycle) => {
        const current = periodsById.get(legacyCycle.id);
        return {
          ...legacyCycle,
          updatedAt: current?.updatedAt ?? legacyCycle.updatedAt,
          source: current?.source ?? "legacy",
        };
      })
    : [...periodsById.values()];
  return { ...state, periods: sortPeriods(periods) };
}

function mergeLegacyNotes(
  state: CycleCalendarState,
  legacyNotes: CalendarNote[],
  now: string,
  authoritative = false,
) {
  const entriesByDate = new Map(
    state.entries.map((entry) => [
      entry.date,
      authoritative ? { ...entry, notes: [] } : entry,
    ]),
  );
  const existingNotes = new Map(
    state.entries.flatMap((entry) => entry.notes.map((note) => [note.id, note] as const)),
  );
  for (const legacyNote of legacyNotes) {
    const current = entriesByDate.get(legacyNote.date) ??
      normalizeDailyEntry({ id: `daily:${legacyNote.date}`, date: legacyNote.date }, now)!;
    const existing = existingNotes.get(legacyNote.id);
    const migrated: CycleNoteRecord = {
      id: legacyNote.id,
      text: legacyNote.note.trim().slice(0, MAX_NOTE_LENGTH),
      symptoms: normalizeStringArray(legacyNote.symptoms),
      emoji: legacyNote.emoji || "📝",
      createdAt: existing?.createdAt ?? dateBasedIso(legacyNote.date),
      updatedAt: existing?.updatedAt ?? dateBasedIso(legacyNote.date),
      source: existing?.source ?? "legacy",
    };
    entriesByDate.set(legacyNote.date, {
      ...current,
      notes: [
        ...current.notes.filter((note) => note.id !== migrated.id),
        migrated,
      ],
    });
  }
  return { ...state, entries: sortEntries([...entriesByDate.values()]) };
}

function validatePeriods(periods: CyclePeriodRecord[]) {
  const ids = new Set<string>();
  for (const period of periods) {
    if (ids.has(period.id)) {
      throw new CycleCalendarValidationError("Existe um periodo duplicado.");
    }
    ids.add(period.id);
    if (!normalizePeriod(period, period.updatedAt)) {
      throw new CycleCalendarValidationError("O periodo possui datas invalidas.");
    }
  }
  for (let index = 0; index < periods.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < periods.length; nextIndex += 1) {
      if (
        rangesOverlap(
          periods[index].startDate,
          periods[index].endDate,
          periods[nextIndex].startDate,
          periods[nextIndex].endDate,
        )
      ) {
        throw new CycleCalendarValidationError(
          "O periodo coincide com outro registro existente.",
        );
      }
    }
  }
}

function serializeLegacyCycles(periods: CyclePeriodRecord[]) {
  return sortPeriods(periods).map<MenstrualCycleRecord>((period) => ({
    id: period.id,
    startDate: period.startDate,
    endDate: period.endDate,
    createdAt: period.createdAt,
  }));
}

function serializeLegacyNotes(entries: DailyCycleEntry[]) {
  return entries
    .flatMap((entry) =>
      entry.notes.map<CalendarNote>((note) => ({
        id: note.id,
        date: entry.date,
        note: note.text,
        symptoms: note.symptoms,
        emoji: note.emoji,
      })),
    )
    .sort((first, second) => second.date.localeCompare(first.date));
}

function stateChanged(first: CycleCalendarState, second: CycleCalendarState) {
  return JSON.stringify(first) !== JSON.stringify(second);
}

async function readCycleCalendarState(): Promise<CycleCalendarState> {
  const now = new Date().toISOString();
  const stored = Object.fromEntries(
    await AsyncStorage.multiGet([
      CYCLE_CALENDAR_STORAGE_KEY,
      MENSTRUAL_CYCLES_STORAGE_KEY,
      CALENDAR_NOTES_STORAGE_KEY,
    ]),
  );
  const parsedV2 = parseJson(stored[CYCLE_CALENDAR_STORAGE_KEY] ?? null);
  const base = parsedV2
    ? migrateStoredState(parsedV2, now)
    : createEmptyCycleCalendarState(now);
  const legacyCycles = parseLegacyCycles(
    stored[MENSTRUAL_CYCLES_STORAGE_KEY] ?? null,
    now,
  );
  const legacyNotes = parseLegacyNotes(
    stored[CALENDAR_NOTES_STORAGE_KEY] ?? null,
  );
  const hasLegacyCyclesStore =
    stored[MENSTRUAL_CYCLES_STORAGE_KEY] !== null &&
    stored[MENSTRUAL_CYCLES_STORAGE_KEY] !== undefined;
  const hasLegacyNotesStore =
    stored[CALENDAR_NOTES_STORAGE_KEY] !== null &&
    stored[CALENDAR_NOTES_STORAGE_KEY] !== undefined;
  let merged = mergeLegacyCycles(base, legacyCycles, hasLegacyCyclesStore);
  merged = mergeLegacyNotes(merged, legacyNotes, now, hasLegacyNotesStore);
  const legacyContentChanged = stateChanged(base, merged);
  const migrationStatusChanged =
    !base.migration.importedLegacyCycles ||
    !base.migration.importedLegacyNotes;
  if (!parsedV2 || legacyContentChanged || migrationStatusChanged) {
    merged = {
      ...merged,
      migration: {
        importedLegacyCycles: true,
        importedLegacyNotes: true,
        lastLegacySyncAt: now,
      },
    };
  }
  validatePeriods(merged.periods);

  if (!parsedV2 || legacyContentChanged || migrationStatusChanged) {
    await AsyncStorage.setItem(CYCLE_CALENDAR_STORAGE_KEY, JSON.stringify(merged));
  }
  return merged;
}

async function persistState(state: CycleCalendarState) {
  validatePeriods(state.periods);
  const normalized = migrateStoredState(state, state.updatedAt);
  await AsyncStorage.multiSet([
    [CYCLE_CALENDAR_STORAGE_KEY, JSON.stringify(normalized)],
    [MENSTRUAL_CYCLES_STORAGE_KEY, JSON.stringify(serializeLegacyCycles(normalized.periods))],
    [CALENDAR_NOTES_STORAGE_KEY, JSON.stringify(serializeLegacyNotes(normalized.entries))],
  ]);
  return normalized;
}

export async function loadCycleCalendarState() {
  await writeQueue.catch(() => undefined);
  return readCycleCalendarState();
}

/**
 * Apaga apenas os novos dados sensiveis (sexo, sintomas, sinais e fatores).
 * Periodos/anotacoes e suas duas chaves antigas permanecem intactos.
 */
export function resetCycleCalendarData() {
  const operation = writeQueue.then(async () => {
    const current = await readCycleCalendarState();
    const now = new Date().toISOString();
    const resetEntries = current.entries
      .filter((entry) => entry.notes.length > 0)
      .map((entry) =>
        normalizeDailyEntry(
          {
            id: entry.id,
            date: entry.date,
            notes: entry.notes,
            createdAt: entry.createdAt,
            updatedAt: now,
          },
          now,
        ),
      )
      .filter((entry): entry is DailyCycleEntry => entry !== null);
    const empty = createEmptyCycleCalendarState(now);
    const reset: CycleCalendarState = {
      ...empty,
      revision: current.revision + 1,
      periods: current.periods,
      entries: sortEntries(resetEntries),
      migration: {
        importedLegacyCycles: true,
        importedLegacyNotes: true,
        lastLegacySyncAt: now,
      },
    };
    await AsyncStorage.setItem(CYCLE_CALENDAR_STORAGE_KEY, JSON.stringify(reset));
    return reset;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

type StateMutation = (state: CycleCalendarState, now: string) => CycleCalendarState;

function mutateState(mutation: StateMutation) {
  const operation = writeQueue.then(async () => {
    const current = await readCycleCalendarState();
    const now = new Date().toISOString();
    const changed = mutation(current, now);
    const next: CycleCalendarState = {
      ...changed,
      schemaVersion: CYCLE_CALENDAR_SCHEMA_VERSION,
      revision: current.revision + 1,
      createdAt: current.createdAt,
      updatedAt: now,
      migration: {
        ...changed.migration,
        lastLegacySyncAt: now,
      },
    };
    return persistState(next);
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

function getOrCreateEntry(state: CycleCalendarState, date: string, now: string) {
  const entry = state.entries.find((item) => item.date === date);
  if (entry) return entry;
  return normalizeDailyEntry(
    { id: `daily:${date}`, date, createdAt: now, updatedAt: now },
    now,
  )!;
}

export function mergeLegacyPeriodsIntoState(
  state: CycleCalendarState,
  cycles: MenstrualCycleRecord[],
) {
  const now = new Date().toISOString();
  const legacy = cycles
    .map((cycle) => normalizePeriod(cycle, now))
    .filter((cycle): cycle is CyclePeriodRecord => cycle !== null)
    .map((cycle) => ({ ...cycle, source: "legacy" as const }));
  return mergeLegacyCycles(state, legacy, true);
}

export function upsertDailyEntry(date: string, update: DailyCycleEntryUpdate) {
  if (!isValidLocalDate(date)) {
    return Promise.reject(new CycleCalendarValidationError("Informe uma data valida."));
  }
  return mutateState((state, now) => {
    const current = getOrCreateEntry(state, date, now);
    const next = normalizeDailyEntry(
      {
        ...current,
        ...update,
        symptoms:
          "symptoms" in update
            ? { ...current.symptoms, ...update.symptoms }
            : current.symptoms,
        fertility:
          "fertility" in update
            ? { ...current.fertility, ...update.fertility }
            : current.fertility,
        factors:
          "factors" in update
            ? { ...current.factors, ...update.factors }
            : current.factors,
        sexualActivityStatus:
          "sexualActivityStatus" in update
            ? update.sexualActivityStatus
            : current.sexualActivityStatus,
        sexualActivities:
          update.sexualActivityStatus &&
          update.sexualActivityStatus !== "activity"
            ? []
            : current.sexualActivities,
        date,
        updatedAt: now,
      },
      now,
    );
    if (!next) throw new CycleCalendarValidationError("Registro diario invalido.");
    return {
      ...state,
      entries: sortEntries([
        ...state.entries.filter((entry) => entry.date !== date),
        next,
      ]),
    };
  });
}

export function deleteDailyEntry(date: string) {
  return mutateState((state) => ({
    ...state,
    entries: state.entries.filter((entry) => entry.date !== date),
  }));
}

function normalizeSexualActivityInput(input: SexualActivityInput) {
  if (input.kind !== "vaginal" && input.kind !== "other") {
    throw new CycleCalendarValidationError("Tipo de atividade sexual invalido.");
  }
  return {
    kind: input.kind,
    protection: input.protection ?? "not_reported",
    ejaculationExposure: input.ejaculationExposure,
    tryingToConceive: input.tryingToConceive,
    note: input.note?.trim().slice(0, MAX_SEXUAL_ACTIVITY_NOTE_LENGTH) || undefined,
  };
}

export function addSexualActivity(date: string, input: SexualActivityInput) {
  if (!isValidLocalDate(date)) {
    return Promise.reject(new CycleCalendarValidationError("Informe uma data valida."));
  }
  const validInput = normalizeSexualActivityInput(input);
  return mutateState((state, now) => {
    const current = getOrCreateEntry(state, date, now);
    const activity: SexualActivityRecord = {
      id: createId("sex"),
      ...validInput,
      createdAt: now,
      updatedAt: now,
    };
    return {
      ...state,
      entries: sortEntries([
        ...state.entries.filter((entry) => entry.date !== date),
        {
          ...current,
          sexualActivityStatus: "activity",
          sexualActivities: [...current.sexualActivities, activity],
          updatedAt: now,
        },
      ]),
    };
  });
}

export function updateSexualActivity(
  date: string,
  activityId: string,
  update: Partial<SexualActivityInput>,
) {
  return mutateState((state, now) => {
    const current = state.entries.find((entry) => entry.date === date);
    const activity = current?.sexualActivities.find((item) => item.id === activityId);
    if (!current || !activity) {
      throw new CycleCalendarValidationError("Registro sexual nao encontrado.");
    }
    const nextActivity = normalizeSexualActivity(
      { ...activity, ...update, updatedAt: now },
      now,
    );
    if (!nextActivity) {
      throw new CycleCalendarValidationError("Registro sexual invalido.");
    }
    return {
      ...state,
      entries: sortEntries([
        ...state.entries.filter((entry) => entry.date !== date),
        {
          ...current,
          sexualActivityStatus: "activity",
          sexualActivities: current.sexualActivities.map((item) =>
            item.id === activityId ? nextActivity : item,
          ),
          updatedAt: now,
        },
      ]),
    };
  });
}

export function deleteSexualActivity(date: string, activityId: string) {
  return mutateState((state, now) => {
    const current = state.entries.find((entry) => entry.date === date);
    if (!current) throw new CycleCalendarValidationError("Registro nao encontrado.");
    const remainingActivities = current.sexualActivities.filter(
      (item) => item.id !== activityId,
    );
    return {
      ...state,
      entries: sortEntries([
        ...state.entries.filter((entry) => entry.date !== date),
        {
          ...current,
          sexualActivityStatus:
            remainingActivities.length > 0 ? "activity" : "not_reported",
          sexualActivities: remainingActivities,
          updatedAt: now,
        },
      ]),
    };
  });
}

export function updateCycleSettings(update: Partial<CycleTrackingSettings>) {
  return mutateState((state) => ({
    ...state,
    settings: normalizeSettings({ ...state.settings, ...update }),
  }));
}

export function updateCycleFactors(update: CycleContextFactorsUpdate) {
  return mutateState((state, now) => ({
    ...state,
    factors: normalizeFactors({ ...state.factors, ...update, updatedAt: now }, now),
  }));
}

export function addPeriod(startDate: string, endDate: string) {
  return mutateState((state, now) => {
    const period = normalizePeriod(
      {
        id: createId("period"),
        startDate,
        endDate,
        source: "cycle_calendar",
        createdAt: now,
        updatedAt: now,
      },
      now,
    );
    if (!period) throw new CycleCalendarValidationError("Periodo invalido.");
    const periods = sortPeriods([...state.periods, period]);
    validatePeriods(periods);
    return { ...state, periods };
  });
}

export function updatePeriod(
  periodId: string,
  update: Partial<Pick<CyclePeriodRecord, "startDate" | "endDate">>,
) {
  return mutateState((state, now) => {
    const current = state.periods.find((period) => period.id === periodId);
    if (!current) throw new CycleCalendarValidationError("Periodo nao encontrado.");
    const changed = normalizePeriod({ ...current, ...update, updatedAt: now }, now);
    if (!changed) throw new CycleCalendarValidationError("Periodo invalido.");
    const periods = sortPeriods(
      state.periods.map((period) => (period.id === periodId ? changed : period)),
    );
    validatePeriods(periods);
    return { ...state, periods };
  });
}

export function deletePeriod(periodId: string) {
  return mutateState((state) => ({
    ...state,
    periods: state.periods.filter((period) => period.id !== periodId),
  }));
}

export interface CycleNoteInput {
  text: string;
  emoji?: string;
  symptoms?: string[];
}

export function addCycleNote(date: string, input: CycleNoteInput) {
  if (!isValidLocalDate(date) || !input.text.trim()) {
    return Promise.reject(new CycleCalendarValidationError("Anotacao invalida."));
  }
  return mutateState((state, now) => {
    const current = getOrCreateEntry(state, date, now);
    const note = normalizeNote(
      {
        id: createId("note"),
        text: input.text,
        emoji: input.emoji,
        symptoms: input.symptoms,
        source: "cycle_calendar",
        createdAt: now,
        updatedAt: now,
      },
      now,
    )!;
    return {
      ...state,
      entries: sortEntries([
        ...state.entries.filter((entry) => entry.date !== date),
        { ...current, notes: [...current.notes, note], updatedAt: now },
      ]),
    };
  });
}

export function updateCycleNote(
  date: string,
  noteId: string,
  input: Partial<CycleNoteInput>,
) {
  return mutateState((state, now) => {
    const current = state.entries.find((entry) => entry.date === date);
    const existing = current?.notes.find((note) => note.id === noteId);
    if (!current || !existing) {
      throw new CycleCalendarValidationError("Anotacao nao encontrada.");
    }
    const note = normalizeNote(
      {
        ...existing,
        text: input.text ?? existing.text,
        emoji: input.emoji ?? existing.emoji,
        symptoms: input.symptoms ?? existing.symptoms,
        updatedAt: now,
      },
      now,
    );
    if (!note) throw new CycleCalendarValidationError("Anotacao invalida.");
    return {
      ...state,
      entries: sortEntries([
        ...state.entries.filter((entry) => entry.date !== date),
        {
          ...current,
          notes: current.notes.map((item) => (item.id === noteId ? note : item)),
          updatedAt: now,
        },
      ]),
    };
  });
}

export function deleteCycleNote(date: string, noteId: string) {
  return mutateState((state, now) => {
    const current = state.entries.find((entry) => entry.date === date);
    if (!current) throw new CycleCalendarValidationError("Anotacao nao encontrada.");
    return {
      ...state,
      entries: sortEntries([
        ...state.entries.filter((entry) => entry.date !== date),
        {
          ...current,
          notes: current.notes.filter((note) => note.id !== noteId),
          updatedAt: now,
        },
      ]),
    };
  });
}
