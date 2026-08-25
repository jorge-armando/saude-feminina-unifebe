import {
  addDays,
  compareLocalDates,
  daysBetween,
  isDateInRange,
  isValidLocalDate,
} from "./menstrualCycle";
import {
  CycleCalendarPrediction,
  CycleCalendarState,
  CycleContextFactors,
  CycleHistoryMetrics,
  CyclePeriodRecord,
  CycleTrackingSettings,
  DailyCycleEntry,
  FertilityContextForDate,
  OvulationEstimate,
  PhaseForDate,
  PredictionConfidence,
  PredictionReason,
} from "../types/cycleCalendar";

const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;
const MIN_LUTEAL_PHASE_DAYS = 11;
const LIKELY_LUTEAL_PHASE_DAYS = 14;
const MAX_LUTEAL_PHASE_DAYS = 17;
const FERTILE_DAYS_BEFORE_OVULATION = 5;

export const DEFAULT_CYCLE_TRACKING_SETTINGS: CycleTrackingSettings = {
  goal: "track_cycle",
  predictionsEnabled: true,
  fertilityEstimatesEnabled: true,
  showSexMarkers: false,
  notificationPrivacy: "neutral",
  ageGroup: "not_reported",
  lookbackCycles: 12,
};

export const DEFAULT_CYCLE_CONTEXT_FACTORS: CycleContextFactors = {
  contraceptiveMethod: "not_reported",
  usesHormonalContraception: false,
  pregnant: false,
  postpartum: false,
  breastfeeding: false,
  perimenopause: false,
  recentlyStoppedHormonalContraception: false,
  updatedAt: new Date(0).toISOString(),
};

export interface CyclePredictionInput {
  periods: CyclePeriodRecord[];
  entries?: DailyCycleEntry[];
  settings?: CycleTrackingSettings;
  factors?: CycleContextFactors;
  now?: Date;
}

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((first, second) => first - second);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function quantile(values: number[], percentile: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((first, second) => first - second);
  const position = (sorted.length - 1) * percentile;
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.ceil(position);
  if (lowerIndex === upperIndex) return sorted[lowerIndex];
  const weight = position - lowerIndex;
  return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}

function roundMetric(value: number | null, digits = 1) {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function medianAbsoluteDeviation(values: number[]) {
  const center = median(values);
  return center === null
    ? null
    : median(values.map((value) => Math.abs(value - center)));
}

function getRobustValues(values: number[]) {
  if (values.length < 3) return values;
  const center = median(values) ?? 0;
  const deviation = medianAbsoluteDeviation(values) ?? 0;
  const tolerance = Math.max(3, deviation * 3);
  const inliers = values.filter(
    (value) => Math.abs(value - center) <= tolerance,
  );
  return inliers.length > 0 ? inliers : values;
}

/** Media robusta com peso progressivo para os ciclos mais recentes. */
function estimateRecentValue(values: number[], fallback: number) {
  if (values.length === 0) return fallback;
  const robustValues = getRobustValues(values);
  const robustSet = new Set(robustValues);
  const chronologicalInliers = values.filter((value) => robustSet.has(value));
  const weighted = chronologicalInliers.reduce(
    (result, value, index) => {
      const weight = index + 1;
      return {
        total: result.total + value * weight,
        weight: result.weight + weight,
      };
    },
    { total: 0, weight: 0 },
  );
  return Math.max(1, Math.round(weighted.total / weighted.weight));
}

function chronologicalPeriods(periods: CyclePeriodRecord[]) {
  return periods
    .filter(
      (period) =>
        isValidLocalDate(period.startDate) &&
        isValidLocalDate(period.endDate) &&
        compareLocalDates(period.startDate, period.endDate) <= 0,
    )
    .sort((first, second) => first.startDate.localeCompare(second.startDate));
}

function getCycleIntervals(periods: CyclePeriodRecord[]) {
  return periods
    .slice(1)
    .map((period, index) =>
      daysBetween(periods[index].startDate, period.startDate),
    )
    .filter((length) => length > 0);
}

function getPeriodLengths(periods: CyclePeriodRecord[]) {
  return periods.map(
    (period) => daysBetween(period.startDate, period.endDate) + 1,
  );
}

function getMedianConsecutiveDifference(values: number[]) {
  return median(
    values
      .slice(1)
      .map((value, index) => Math.abs(value - values[index])),
  );
}

function uniqueReasons(reasons: PredictionReason[]) {
  return [...new Set(reasons)];
}

function downgradeConfidence(confidence: PredictionConfidence) {
  if (confidence === "high") return "medium" as const;
  if (confidence === "medium") return "low" as const;
  return confidence;
}

function getBaseConfidence(
  intervalCount: number,
  variabilityDays: number | null,
): PredictionConfidence {
  if (intervalCount === 0) return "insufficient";
  if (intervalCount < 2) return "low";
  if ((variabilityDays ?? 0) >= 9) return "low";
  if (intervalCount >= 5 && (variabilityDays ?? Number.POSITIVE_INFINITY) <= 3) {
    return "high";
  }
  return "medium";
}

function buildPredictionReasons(
  intervalCount: number,
  variabilityDays: number | null,
  settings: CycleTrackingSettings,
  factors: CycleContextFactors,
) {
  const reasons: PredictionReason[] = [];
  if (!settings.predictionsEnabled) reasons.push("predictions_disabled");
  if (!settings.fertilityEstimatesEnabled) {
    reasons.push("fertility_estimates_disabled");
  }
  if (intervalCount === 0) reasons.push("population_fallback");
  else if (intervalCount < 3) reasons.push("few_cycles");
  else if ((variabilityDays ?? 0) >= 9) reasons.push("variable_history");
  else reasons.push("stable_history");
  if (factors.usesHormonalContraception) reasons.push("hormonal_contraception");
  if (factors.pregnant) reasons.push("pregnancy");
  if (factors.postpartum) reasons.push("postpartum");
  if (factors.breastfeeding) reasons.push("breastfeeding");
  if (factors.perimenopause) reasons.push("perimenopause");
  if (factors.recentlyStoppedHormonalContraception) {
    reasons.push("recent_hormonal_change");
  }
  return reasons;
}

function getPredictionAvailability(
  settings: CycleTrackingSettings,
  factors: CycleContextFactors,
) {
  const predictionAvailable =
    settings.predictionsEnabled &&
    !factors.pregnant &&
    !factors.usesHormonalContraception;
  const fertilityEstimateAvailable =
    predictionAvailable &&
    settings.fertilityEstimatesEnabled &&
    !factors.postpartum &&
    !factors.breastfeeding &&
    !factors.perimenopause &&
    !factors.recentlyStoppedHormonalContraception;
  return { predictionAvailable, fertilityEstimateAvailable };
}

function calculateStartUncertainty(
  intervals: number[],
  estimatedCycleLength: number,
) {
  if (intervals.length === 0) {
    return {
      earliestLength: Math.max(1, estimatedCycleLength - 7),
      latestLength: estimatedCycleLength + 7,
    };
  }
  if (intervals.length === 1) {
    return {
      earliestLength: Math.max(1, estimatedCycleLength - 5),
      latestLength: estimatedCycleLength + 5,
    };
  }

  const lower = quantile(intervals, 0.1) ?? estimatedCycleLength;
  const upper = quantile(intervals, 0.9) ?? estimatedCycleLength;
  const minimumPadding = intervals.length < 4 ? 3 : 2;
  return {
    earliestLength: Math.max(
      1,
      Math.min(
        estimatedCycleLength - minimumPadding,
        Math.floor(lower) - 1,
      ),
    ),
    latestLength: Math.max(
      estimatedCycleLength + minimumPadding,
      Math.ceil(upper) + 1,
    ),
  };
}

function findTemperatureShift(entries: DailyCycleEntry[]) {
  const temperatures = entries
    .filter(
      (entry) =>
        typeof entry.fertility.basalTemperatureCelsius === "number" &&
        Number.isFinite(entry.fertility.basalTemperatureCelsius) &&
        !["illness", "poor_sleep", "alcohol", "uncertain"].includes(
          entry.fertility.temperatureReliability ?? "reliable",
        ),
    )
    .sort((first, second) => first.date.localeCompare(second.date));

  for (let index = 6; index <= temperatures.length - 3; index += 1) {
    const highReadings = temperatures.slice(index, index + 3);
    const areConsecutive = highReadings.every(
      (entry, highIndex) =>
        highIndex === 0 ||
        daysBetween(highReadings[highIndex - 1].date, entry.date) === 1,
    );
    if (!areConsecutive) continue;

    const baselineReadings = temperatures
      .slice(Math.max(0, index - 8), index)
      .slice(-6)
      .map((entry) => entry.fertility.basalTemperatureCelsius as number);
    if (baselineReadings.length < 6) continue;
    const baseline = median(baselineReadings) ?? 0;
    const sustainedRise = highReadings.every(
      (entry) =>
        (entry.fertility.basalTemperatureCelsius as number) >= baseline + 0.2,
    );
    if (sustainedRise) return highReadings[0].date;
  }
  return null;
}

function buildOvulationEstimate(
  entries: DailyCycleEntry[],
  latestPeriod: CyclePeriodRecord,
  likelyPeriodStart: string,
  periodStartEarliest: string,
  periodStartLatest: string,
  confidence: PredictionConfidence,
): OvulationEstimate {
  const currentCycleEntries = entries.filter(
    (entry) => compareLocalDates(entry.date, latestPeriod.startDate) >= 0,
  );
  const positiveLhEntry = [...currentCycleEntries]
    .filter((entry) =>
      ["positive", "peak"].includes(entry.fertility.ovulationTest ?? ""),
    )
    .sort((first, second) => second.date.localeCompare(first.date))[0];
  const temperatureShiftDate = findTemperatureShift(currentCycleEntries);
  const hasFertileMucus = currentCycleEntries.some((entry) =>
    ["watery", "egg_white"].includes(entry.fertility.cervicalMucus ?? ""),
  );

  const evidence: PredictionReason[] = [];
  if (positiveLhEntry) evidence.push("positive_lh_test");
  if (temperatureShiftDate) evidence.push("temperature_shift");
  if (hasFertileMucus) evidence.push("fertile_cervical_mucus");

  if (positiveLhEntry) {
    let biomarkerConfidence: PredictionConfidence = "medium";
    if (temperatureShiftDate) biomarkerConfidence = "high";
    return {
      startDate: positiveLhEntry.date,
      likelyDate: addDays(positiveLhEntry.date, 1),
      endDate: addDays(positiveLhEntry.date, 2),
      confidence: biomarkerConfidence,
      evidence,
      retrospective: Boolean(temperatureShiftDate),
    };
  }

  if (temperatureShiftDate) {
    return {
      startDate: addDays(temperatureShiftDate, -2),
      likelyDate: addDays(temperatureShiftDate, -1),
      endDate: addDays(temperatureShiftDate, -1),
      confidence: "medium",
      evidence,
      retrospective: true,
    };
  }

  return {
    startDate: addDays(periodStartEarliest, -MAX_LUTEAL_PHASE_DAYS),
    likelyDate: addDays(likelyPeriodStart, -LIKELY_LUTEAL_PHASE_DAYS),
    endDate: addDays(periodStartLatest, -MIN_LUTEAL_PHASE_DAYS),
    confidence,
    evidence,
    retrospective: false,
  };
}

function normalizePredictionInput(
  input: CycleCalendarState | CyclePredictionInput,
): Required<Omit<CyclePredictionInput, "now">> & { now?: Date } {
  if ("schemaVersion" in input) {
    return {
      periods: input.periods,
      entries: input.entries,
      settings: input.settings,
      factors: input.factors,
    };
  }
  return {
    periods: input.periods,
    entries: input.entries ?? [],
    settings: input.settings ?? DEFAULT_CYCLE_TRACKING_SETTINGS,
    factors: input.factors ?? DEFAULT_CYCLE_CONTEXT_FACTORS,
    now: input.now,
  };
}

export function calculateCyclePredictionV2(
  input: CycleCalendarState | CyclePredictionInput,
): CycleCalendarPrediction | null {
  const normalized = normalizePredictionInput(input);
  const allPeriods = chronologicalPeriods(normalized.periods);
  if (allPeriods.length === 0) return null;

  const lookback = Math.min(
    12,
    Math.max(3, Math.round(normalized.settings.lookbackCycles || 12)),
  );
  const periods = allPeriods.slice(-lookback);
  const intervals = getCycleIntervals(periods);
  const periodLengths = getPeriodLengths(periods);
  const estimatedCycleLength = estimateRecentValue(
    intervals,
    DEFAULT_CYCLE_LENGTH,
  );
  const estimatedPeriodLength = Math.min(
    estimatedCycleLength,
    estimateRecentValue(periodLengths, DEFAULT_PERIOD_LENGTH),
  );
  const periodLengthLow = Math.max(
    1,
    Math.floor(quantile(periodLengths, 0.1) ?? estimatedPeriodLength),
  );
  const periodLengthHigh = Math.max(
    estimatedPeriodLength,
    Math.ceil(quantile(periodLengths, 0.9) ?? estimatedPeriodLength),
  );
  const variabilityDays = roundMetric(
    getMedianConsecutiveDifference(intervals) ??
      medianAbsoluteDeviation(intervals),
  );
  const latestPeriod = periods[periods.length - 1];
  const uncertainty = calculateStartUncertainty(
    intervals,
    estimatedCycleLength,
  );
  let likelyStart = addDays(latestPeriod.startDate, estimatedCycleLength);
  let earliestStart = addDays(
    latestPeriod.startDate,
    uncertainty.earliestLength,
  );
  let latestStart = addDays(
    latestPeriod.startDate,
    uncertainty.latestLength,
  );
  let confidence = getBaseConfidence(intervals.length, variabilityDays);
  if (
    normalized.factors.postpartum ||
    normalized.factors.breastfeeding ||
    normalized.factors.perimenopause ||
    normalized.factors.recentlyStoppedHormonalContraception
  ) {
    confidence = downgradeConfidence(confidence);
  }
  const availability = getPredictionAvailability(
    normalized.settings,
    normalized.factors,
  );
  if (!availability.predictionAvailable) confidence = "insufficient";
  const reasons = buildPredictionReasons(
    intervals.length,
    variabilityDays,
    normalized.settings,
    normalized.factors,
  );

  const ovulation = availability.fertilityEstimateAvailable
    ? buildOvulationEstimate(
        normalized.entries,
        latestPeriod,
        likelyStart,
        earliestStart,
        latestStart,
        confidence,
      )
    : null;
  reasons.push(...(ovulation?.evidence ?? []));

  if (
    ovulation &&
    ovulation.evidence.some((reason) =>
      ["positive_lh_test", "temperature_shift"].includes(reason),
    )
  ) {
    likelyStart = addDays(ovulation.likelyDate, LIKELY_LUTEAL_PHASE_DAYS);
    earliestStart = addDays(ovulation.startDate, MIN_LUTEAL_PHASE_DAYS);
    latestStart = addDays(ovulation.endDate, MAX_LUTEAL_PHASE_DAYS);
    if (confidence === "insufficient") confidence = "low";
  }
  const likelyEnd = addDays(likelyStart, estimatedPeriodLength - 1);

  return {
    startDate: likelyStart,
    endDate: likelyEnd,
    periodStartRange: {
      startDate: earliestStart,
      endDate: latestStart,
    },
    periodEndRange: {
      startDate: addDays(earliestStart, periodLengthLow - 1),
      endDate: addDays(latestStart, periodLengthHigh - 1),
    },
    averageCycleLength: estimatedCycleLength,
    averagePeriodLength: estimatedPeriodLength,
    basedOnCycles: periods.length,
    observedIntervals: intervals.length,
    variabilityDays,
    confidence,
    reasons: uniqueReasons(reasons),
    predictionAvailable: availability.predictionAvailable,
    fertilityEstimateAvailable: availability.fertilityEstimateAvailable,
    fertileWindow: ovulation
      ? {
          startDate: addDays(
            ovulation.startDate,
            -FERTILE_DAYS_BEFORE_OVULATION,
          ),
          endDate: ovulation.endDate,
        }
      : null,
    ovulation,
    generatedAt: (normalized.now ?? new Date()).toISOString(),
  };
}

export function getEntryForDate(
  state: Pick<CycleCalendarState, "entries">,
  date: string,
) {
  return state.entries.find((entry) => entry.date === date) ?? null;
}

export function getPhaseForDate(
  date: string,
  prediction: CycleCalendarPrediction | null,
  periods: CyclePeriodRecord[],
): PhaseForDate {
  const recordedPeriod = chronologicalPeriods(periods).find((period) =>
    isDateInRange(date, period.startDate, period.endDate),
  );
  if (recordedPeriod) {
    return {
      phase: "recorded_period",
      isEstimated: false,
      confidence: "high",
      fertilityLevel: "low",
    };
  }
  if (!prediction?.predictionAvailable) {
    return {
      phase: "unknown",
      isEstimated: true,
      confidence: "insufficient",
      fertilityLevel: "unknown",
    };
  }
  if (
    isDateInRange(
      date,
      prediction.periodStartRange.startDate,
      prediction.periodEndRange.endDate,
    )
  ) {
    return {
      phase: "predicted_period",
      isEstimated: true,
      confidence: prediction.confidence,
      fertilityLevel: "low",
    };
  }

  const ovulation = prediction.ovulation;
  if (
    prediction.fertilityEstimateAvailable &&
    prediction.fertileWindow &&
    ovulation
  ) {
    if (date === ovulation.likelyDate) {
      return {
        phase: "estimated_ovulation",
        isEstimated: true,
        confidence: ovulation.confidence,
        fertilityLevel: "higher",
      };
    }
    if (isDateInRange(date, prediction.fertileWindow.startDate, prediction.fertileWindow.endDate)) {
      const higherStart = addDays(ovulation.likelyDate, -2);
      return {
        phase: "fertile_window",
        isEstimated: true,
        confidence: ovulation.confidence,
        fertilityLevel: isDateInRange(date, higherStart, ovulation.likelyDate)
          ? "higher"
          : "possible",
      };
    }
  }

  const latestPeriod = chronologicalPeriods(periods)
    .filter((period) => compareLocalDates(period.startDate, date) <= 0)
    .at(-1);
  if (!latestPeriod || compareLocalDates(date, prediction.endDate) > 0) {
    return {
      phase: "unknown",
      isEstimated: true,
      confidence: prediction.confidence,
      fertilityLevel: prediction.fertilityEstimateAvailable ? "low" : "unknown",
    };
  }
  if (ovulation && compareLocalDates(date, ovulation.endDate) > 0) {
    return {
      phase: "luteal",
      isEstimated: true,
      confidence: prediction.confidence,
      fertilityLevel: "low",
    };
  }
  if (compareLocalDates(date, latestPeriod.endDate) > 0) {
    return {
      phase: "follicular",
      isEstimated: true,
      confidence: prediction.confidence,
      fertilityLevel: prediction.fertilityEstimateAvailable ? "low" : "unknown",
    };
  }
  return {
    phase: "unknown",
    isEstimated: true,
    confidence: prediction.confidence,
    fertilityLevel: "unknown",
  };
}

export function getFertilityContextForDate(
  date: string,
  state: Pick<CycleCalendarState, "entries" | "periods">,
  prediction: CycleCalendarPrediction | null,
): FertilityContextForDate {
  const phase = getPhaseForDate(date, prediction, state.periods);
  const entry = getEntryForDate(state, date);
  const relationRecorded = entry?.sexualActivityStatus === "activity";
  const unprotectedVaginalSexRecorded = Boolean(
    entry?.sexualActivities.some(
      (activity) =>
        activity.kind === "vaginal" &&
        ["none", "condom_failure"].includes(activity.protection),
    ),
  );
  const messageKey =
    phase.fertilityLevel === "unknown"
      ? "unknown"
      : unprotectedVaginalSexRecorded &&
          ["possible", "higher"].includes(phase.fertilityLevel)
        ? "relation_inside_possible_window"
        : phase.fertilityLevel === "higher"
          ? "inside_higher_window"
          : phase.fertilityLevel === "possible"
            ? "inside_possible_window"
            : "outside_estimated_window";
  return {
    level: phase.fertilityLevel,
    confidence: phase.confidence,
    relationRecorded,
    unprotectedVaginalSexRecorded,
    messageKey,
  };
}

function retrospectiveErrors(periods: CyclePeriodRecord[]) {
  const errors: {
    absolute: number;
    signed: number;
    insideRange: boolean;
    intervalWidth: number;
  }[] = [];
  for (let targetIndex = 2; targetIndex < periods.length; targetIndex += 1) {
    const history = periods.slice(0, targetIndex);
    const historyIntervals = getCycleIntervals(history);
    const expectedLength = estimateRecentValue(
      historyIntervals.slice(-11),
      DEFAULT_CYCLE_LENGTH,
    );
    const uncertainty = calculateStartUncertainty(
      historyIntervals.slice(-11),
      expectedLength,
    );
    const predictedDate = addDays(history.at(-1)!.startDate, expectedLength);
    const earliestDate = addDays(
      history.at(-1)!.startDate,
      uncertainty.earliestLength,
    );
    const latestDate = addDays(
      history.at(-1)!.startDate,
      uncertainty.latestLength,
    );
    const actualDate = periods[targetIndex].startDate;
    const signed = daysBetween(predictedDate, actualDate);
    errors.push({
      absolute: Math.abs(signed),
      signed,
      insideRange: isDateInRange(actualDate, earliestDate, latestDate),
      intervalWidth: daysBetween(earliestDate, latestDate) + 1,
    });
  }
  return errors;
}

function percentWithin(values: number[], tolerance: number) {
  if (values.length === 0) return null;
  return roundMetric(
    (values.filter((value) => value <= tolerance).length / values.length) * 100,
  );
}

export function calculateCycleHistoryMetrics(
  input: CycleCalendarState | CyclePeriodRecord[],
): CycleHistoryMetrics {
  const periods = chronologicalPeriods(
    Array.isArray(input) ? input : input.periods,
  );
  const intervals = getCycleIntervals(periods);
  const periodLengths = getPeriodLengths(periods);
  const consecutiveDifferences = intervals
    .slice(1)
    .map((value, index) => Math.abs(value - intervals[index]));
  const consecutiveDifference = median(consecutiveDifferences);
  const deviation = medianAbsoluteDeviation(intervals);
  const variability =
    intervals.length < 2
      ? "unknown"
      : (consecutiveDifference ?? 0) >= 9
        ? "high"
        : (consecutiveDifference ?? 0) >= 4
          ? "moderate"
          : "low";
  const errors = retrospectiveErrors(periods);
  const absoluteErrors = errors.map((error) => error.absolute);
  return {
    recordedPeriods: periods.length,
    observedCycleIntervals: intervals.length,
    medianCycleLength: roundMetric(median(intervals)),
    averageCycleLength: roundMetric(average(intervals)),
    shortestCycleLength: intervals.length ? Math.min(...intervals) : null,
    longestCycleLength: intervals.length ? Math.max(...intervals) : null,
    medianPeriodLength: roundMetric(median(periodLengths)),
    shortestPeriodLength: periodLengths.length
      ? Math.min(...periodLengths)
      : null,
    longestPeriodLength: periodLengths.length
      ? Math.max(...periodLengths)
      : null,
    medianConsecutiveDifferenceDays: roundMetric(consecutiveDifference),
    medianAbsoluteDeviationDays: roundMetric(deviation),
    variability,
    backtest: {
      samples: errors.length,
      lastAbsoluteErrorDays: errors.at(-1)?.absolute ?? null,
      meanAbsoluteErrorDays: roundMetric(average(absoluteErrors)),
      medianAbsoluteErrorDays: roundMetric(median(absoluteErrors)),
      meanBiasDays: roundMetric(average(errors.map((error) => error.signed))),
      withinOneDayPercent: percentWithin(absoluteErrors, 1),
      withinTwoDaysPercent: percentWithin(absoluteErrors, 2),
      withinThreeDaysPercent: percentWithin(absoluteErrors, 3),
      intervalCoveragePercent: errors.length
        ? roundMetric(
            (errors.filter((error) => error.insideRange).length /
              errors.length) *
              100,
          )
        : null,
      averageIntervalWidthDays: roundMetric(
        average(errors.map((error) => error.intervalWidth)),
      ),
    },
  };
}
