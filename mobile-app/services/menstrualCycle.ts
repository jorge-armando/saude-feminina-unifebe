import AsyncStorage from "@react-native-async-storage/async-storage";

export const MENSTRUAL_CYCLES_STORAGE_KEY =
  "@saudeFeminina:menstrualCycles:v1";

export interface MenstrualCycleRecord {
  id: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface CyclePrediction {
  startDate: string;
  endDate: string;
  averageCycleLength: number;
  averagePeriodLength: number;
  basedOnCycles: number;
}

export class MenstrualCycleStorageError extends Error {
  constructor(message = "Os registros locais estão em um formato inválido.") {
    super(message);
    this.name = "MenstrualCycleStorageError";
  }
}

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const DEFAULT_CYCLE_LENGTH_DAYS = 28;
const MIN_ROBUST_SAMPLE_SIZE = 3;
const MIN_OUTLIER_TOLERANCE_DAYS = 3;
export const MAX_RECORDED_PERIOD_DAYS = 90;

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
] as const;

function getDateParts(value: string) {
  const match = LOCAL_DATE_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function toUtcTimestamp(value: string) {
  const parts = getDateParts(value);

  if (!parts) {
    return Number.NaN;
  }

  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

export function isValidLocalDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const parts = getDateParts(value);

  if (!parts) {
    return false;
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));

  return (
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() === parts.month - 1 &&
    date.getUTCDate() === parts.day
  );
}

export function toLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function localDateFromParts(
  year: number,
  monthIndex: number,
  day: number
) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
}

export function compareLocalDates(first: string, second: string) {
  return first.localeCompare(second);
}

export function daysBetween(startDate: string, endDate: string) {
  return Math.round(
    (toUtcTimestamp(endDate) - toUtcTimestamp(startDate)) /
      DAY_IN_MILLISECONDS
  );
}

export function addDays(value: string, amount: number) {
  const timestamp = toUtcTimestamp(value);
  const date = new Date(timestamp + amount * DAY_IN_MILLISECONDS);

  return localDateFromParts(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
}

export function isDateInRange(
  date: string,
  startDate: string,
  endDate: string
) {
  return (
    compareLocalDates(date, startDate) >= 0 &&
    compareLocalDates(date, endDate) <= 0
  );
}

export function rangesOverlap(
  firstStart: string,
  firstEnd: string,
  secondStart: string,
  secondEnd: string
) {
  return (
    compareLocalDates(firstStart, secondEnd) <= 0 &&
    compareLocalDates(firstEnd, secondStart) >= 0
  );
}

export function formatLongDate(value: string, includeYear = true) {
  const parts = getDateParts(value);

  if (!parts || !isValidLocalDate(value)) {
    return value;
  }

  const year = includeYear ? ` de ${parts.year}` : "";
  return `${parts.day} de ${MONTH_NAMES[parts.month - 1]}${year}`;
}

export function formatShortDate(value: string) {
  const parts = getDateParts(value);

  if (!parts || !isValidLocalDate(value)) {
    return value;
  }

  return `${String(parts.day).padStart(2, "0")}/${String(parts.month).padStart(
    2,
    "0"
  )}/${parts.year}`;
}

export function formatMonthYear(year: number, monthIndex: number) {
  const month = MONTH_NAMES[monthIndex];
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`;
}

export function sortCyclesNewestFirst(records: MenstrualCycleRecord[]) {
  return [...records].sort((first, second) =>
    second.startDate.localeCompare(first.startDate)
  );
}

function calculateMedian(values: number[]) {
  const sortedValues = [...values].sort((first, second) => first - second);
  const middleIndex = Math.floor(sortedValues.length / 2);

  return sortedValues.length % 2 === 0
    ? (sortedValues[middleIndex - 1] + sortedValues[middleIndex]) / 2
    : sortedValues[middleIndex];
}

/**
 * Usa todos os valores quando o histórico ainda é pequeno. Com três ou mais
 * observações, remove apenas valores muito distantes da mediana pessoal usando
 * o desvio absoluto mediano (MAD). Lacunas longas nunca são divididas em ciclos
 * presumidos: elas só deixam de influenciar a média quando os demais registros
 * dão evidência suficiente de que são um outlier.
 */
function calculateRobustRoundedAverage(values: number[], fallback: number) {
  if (values.length === 0) {
    return fallback;
  }

  let valuesForAverage = values;

  if (values.length >= MIN_ROBUST_SAMPLE_SIZE) {
    const median = calculateMedian(values);
    const absoluteDeviations = values.map((value) =>
      Math.abs(value - median)
    );
    const medianAbsoluteDeviation = calculateMedian(absoluteDeviations);
    const tolerance = Math.max(
      MIN_OUTLIER_TOLERANCE_DAYS,
      medianAbsoluteDeviation * 3
    );
    const inliers = values.filter(
      (value) => Math.abs(value - median) <= tolerance
    );

    if (inliers.length > 0) {
      valuesForAverage = inliers;
    }
  }

  return Math.round(
    valuesForAverage.reduce((total, value) => total + value, 0) /
      valuesForAverage.length
  );
}

function isMenstrualCycleRecord(
  value: unknown
): value is MenstrualCycleRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<MenstrualCycleRecord>;

  return (
    typeof record.id === "string" &&
    record.id.length > 0 &&
    isValidLocalDate(record.startDate) &&
    isValidLocalDate(record.endDate) &&
    compareLocalDates(record.startDate, record.endDate) <= 0 &&
    daysBetween(record.startDate, record.endDate) + 1 <=
      MAX_RECORDED_PERIOD_DAYS &&
    typeof record.createdAt === "string" &&
    !Number.isNaN(Date.parse(record.createdAt))
  );
}

function hasConsistentRecords(records: MenstrualCycleRecord[]) {
  const ids = new Set(records.map((record) => record.id));

  if (ids.size !== records.length) {
    return false;
  }

  return records.every((record, index) =>
    records.slice(index + 1).every(
      (otherRecord) =>
        !rangesOverlap(
          record.startDate,
          record.endDate,
          otherRecord.startDate,
          otherRecord.endDate
        )
    )
  );
}

export async function loadMenstrualCycles() {
  const storedValue = await AsyncStorage.getItem(MENSTRUAL_CYCLES_STORAGE_KEY);

  if (storedValue === null) {
    return [];
  }

  let parsedValue: unknown;

  try {
    parsedValue = JSON.parse(storedValue);
  } catch {
    throw new MenstrualCycleStorageError();
  }

  if (
    !Array.isArray(parsedValue) ||
    !parsedValue.every(isMenstrualCycleRecord) ||
    !hasConsistentRecords(parsedValue)
  ) {
    throw new MenstrualCycleStorageError();
  }

  return sortCyclesNewestFirst(parsedValue);
}

export async function saveMenstrualCycles(records: MenstrualCycleRecord[]) {
  if (
    !records.every(isMenstrualCycleRecord) ||
    !hasConsistentRecords(records)
  ) {
    throw new MenstrualCycleStorageError(
      "Não foi possível salvar um registro com datas inválidas."
    );
  }

  const validRecords = sortCyclesNewestFirst(records);

  await AsyncStorage.setItem(
    MENSTRUAL_CYCLES_STORAGE_KEY,
    JSON.stringify(validRecords)
  );
}

export function createMenstrualCycleRecord(
  startDate: string,
  endDate: string
): MenstrualCycleRecord {
  if (
    !isValidLocalDate(startDate) ||
    !isValidLocalDate(endDate) ||
    compareLocalDates(startDate, endDate) > 0
  ) {
    throw new MenstrualCycleStorageError(
      "O início e o término do período precisam ser datas válidas."
    );
  }

  if (daysBetween(startDate, endDate) + 1 > MAX_RECORDED_PERIOD_DAYS) {
    throw new MenstrualCycleStorageError(
      `O período não pode ultrapassar ${MAX_RECORDED_PERIOD_DAYS} dias.`
    );
  }

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    startDate,
    endDate,
    createdAt: new Date().toISOString(),
  };
}

export function calculateCyclePrediction(
  records: MenstrualCycleRecord[]
): CyclePrediction | null {
  if (records.length === 0) {
    return null;
  }

  const chronologicalRecords = [...records].sort((first, second) =>
    first.startDate.localeCompare(second.startDate)
  );
  const cycleIntervals = chronologicalRecords
    .slice(1)
    .map((record, index) =>
      daysBetween(chronologicalRecords[index].startDate, record.startDate)
    )
    .filter((interval) => interval > 0);
  const periodLengths = chronologicalRecords.map(
    (record) => daysBetween(record.startDate, record.endDate) + 1
  );

  const calculatedCycleLength = Math.max(
    1,
    calculateRobustRoundedAverage(
      cycleIntervals,
      DEFAULT_CYCLE_LENGTH_DAYS
    )
  );
  const averagePeriodLength = Math.max(
    1,
    calculateRobustRoundedAverage(periodLengths, 1)
  );
  const averageCycleLength = Math.max(
    calculatedCycleLength,
    averagePeriodLength
  );
  const latestRecord = chronologicalRecords[chronologicalRecords.length - 1];

  const predictedStartDate = addDays(
    latestRecord.startDate,
    averageCycleLength
  );
  const predictedEndDate = addDays(
    predictedStartDate,
    averagePeriodLength - 1
  );

  return {
    startDate: predictedStartDate,
    endDate: predictedEndDate,
    averageCycleLength,
    averagePeriodLength,
    basedOnCycles: chronologicalRecords.length,
  };
}

export function calculateCurrentCycleDay(
  records: MenstrualCycleRecord[],
  averageCycleLength: number,
  today = toLocalDate(new Date())
) {
  const latestPastRecord = sortCyclesNewestFirst(records).find(
    (record) => compareLocalDates(record.startDate, today) <= 0
  );

  if (!latestPastRecord) {
    return null;
  }

  const elapsedDays = Math.max(0, daysBetween(latestPastRecord.startDate, today));
  return (elapsedDays % Math.max(1, averageCycleLength)) + 1;
}
