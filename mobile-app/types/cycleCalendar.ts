export const CYCLE_CALENDAR_SCHEMA_VERSION = 2 as const;

export type LocalDateString = string;
export type CycleGoal =
  | "track_cycle"
  | "trying_to_conceive"
  | "track_fertility";
export type PredictionConfidence =
  | "insufficient"
  | "low"
  | "medium"
  | "high";
export type CyclePhase =
  | "recorded_period"
  | "predicted_period"
  | "follicular"
  | "fertile_window"
  | "estimated_ovulation"
  | "luteal"
  | "unknown";
export type FertilityLevel = "unknown" | "low" | "possible" | "higher";

export type BleedingFlow = "spotting" | "light" | "medium" | "heavy";
export type SymptomSeverity = "mild" | "moderate" | "severe";
export type CycleSymptom =
  | "cramps"
  | "pelvic_pain"
  | "headache"
  | "back_pain"
  | "breast_tenderness"
  | "bloating"
  | "acne"
  | "nausea"
  | "fatigue"
  | "digestive_changes";
export type CervicalMucus =
  | "dry"
  | "sticky"
  | "creamy"
  | "watery"
  | "egg_white";
export type OvulationTestResult = "negative" | "positive" | "peak" | "unclear";
export type PregnancyTestResult = "negative" | "positive" | "unclear";
export type DailyScale = 1 | 2 | 3 | 4 | 5;
export type StressLevel = "low" | "moderate" | "high";
export type ContraceptiveAdherence = "on_time" | "late" | "missed";
export type TemperatureReliability =
  | "reliable"
  | "poor_sleep"
  | "different_time"
  | "illness"
  | "alcohol"
  | "uncertain";

export interface DailyFertilitySignals {
  cervicalMucus?: CervicalMucus;
  basalTemperatureCelsius?: number;
  basalTemperatureTime?: string;
  temperatureReliability?: TemperatureReliability;
  ovulationTest?: OvulationTestResult;
  pregnancyTest?: PregnancyTestResult;
}

export interface DailyCycleFactors {
  illness?: boolean;
  fever?: boolean;
  stress?: StressLevel;
  poorSleep?: boolean;
  travel?: boolean;
  medicationChange?: boolean;
  emergencyContraception?: boolean;
  contraceptiveAdherence?: ContraceptiveAdherence;
  notes?: string;
}

export type SexualActivityKind = "vaginal" | "other";
export type SexualActivityStatus = "not_reported" | "none" | "activity";
export type SexualProtection =
  | "not_reported"
  | "none"
  | "condom"
  | "condom_failure"
  | "other_contraception";
export type EjaculationExposure = "yes" | "no" | "unknown";

export interface SexualActivityRecord {
  id: string;
  kind: SexualActivityKind;
  protection: SexualProtection;
  ejaculationExposure?: EjaculationExposure;
  tryingToConceive?: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SexualActivityInput {
  kind: SexualActivityKind;
  protection?: SexualProtection;
  ejaculationExposure?: EjaculationExposure;
  tryingToConceive?: boolean;
  note?: string;
}

export interface CycleNoteRecord {
  id: string;
  text: string;
  emoji: string;
  symptoms: string[];
  createdAt: string;
  updatedAt: string;
  source: "legacy" | "cycle_calendar";
}

export interface DailyCycleEntry {
  id: string;
  date: LocalDateString;
  bleeding?: BleedingFlow;
  symptoms: Partial<Record<CycleSymptom, SymptomSeverity>>;
  moods: string[];
  energy?: DailyScale;
  sleep?: DailyScale;
  libido?: DailyScale;
  fertility: DailyFertilitySignals;
  /** Distingue ausencia de informacao de um "nao" registrado. */
  sexualActivityStatus: SexualActivityStatus;
  sexualActivities: SexualActivityRecord[];
  medications: string[];
  factors: DailyCycleFactors;
  notes: CycleNoteRecord[];
  createdAt: string;
  updatedAt: string;
}

export type DailyCycleEntryUpdate = Partial<
  Pick<
    DailyCycleEntry,
    | "bleeding"
    | "symptoms"
    | "moods"
    | "energy"
    | "sleep"
    | "libido"
    | "fertility"
    | "sexualActivityStatus"
    | "medications"
    | "factors"
  >
>;

export interface CyclePeriodRecord {
  id: string;
  startDate: LocalDateString;
  endDate: LocalDateString;
  createdAt: string;
  updatedAt: string;
  source: "legacy" | "cycle_calendar";
}

export type AgeGroup = "teen" | "adult" | "not_reported";
export type NotificationPrivacy = "neutral" | "detailed";
export type ContraceptiveMethod =
  | "not_reported"
  | "none"
  | "combined_pill"
  | "progestin_pill"
  | "hormonal_iud"
  | "copper_iud"
  | "implant"
  | "injection"
  | "patch"
  | "ring"
  | "condom"
  | "other";

export interface CycleTrackingSettings {
  goal: CycleGoal;
  predictionsEnabled: boolean;
  fertilityEstimatesEnabled: boolean;
  showSexMarkers: boolean;
  notificationPrivacy: NotificationPrivacy;
  ageGroup: AgeGroup;
  lookbackCycles: number;
}

export interface CycleContextFactors {
  contraceptiveMethod: ContraceptiveMethod;
  usesHormonalContraception: boolean;
  pregnant: boolean;
  postpartum: boolean;
  breastfeeding: boolean;
  perimenopause: boolean;
  recentlyStoppedHormonalContraception: boolean;
  updatedAt: string;
}

export type CycleContextFactorsUpdate = Partial<
  Omit<CycleContextFactors, "updatedAt">
>;

export interface CycleCalendarMigrationInfo {
  importedLegacyCycles: boolean;
  importedLegacyNotes: boolean;
  lastLegacySyncAt: string | null;
}

export interface CycleCalendarState {
  schemaVersion: typeof CYCLE_CALENDAR_SCHEMA_VERSION;
  revision: number;
  periods: CyclePeriodRecord[];
  entries: DailyCycleEntry[];
  settings: CycleTrackingSettings;
  factors: CycleContextFactors;
  migration: CycleCalendarMigrationInfo;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarDateRange {
  startDate: LocalDateString;
  endDate: LocalDateString;
}

export type PredictionReason =
  | "population_fallback"
  | "few_cycles"
  | "stable_history"
  | "variable_history"
  | "positive_lh_test"
  | "fertile_cervical_mucus"
  | "temperature_shift"
  | "hormonal_contraception"
  | "pregnancy"
  | "postpartum"
  | "breastfeeding"
  | "perimenopause"
  | "recent_hormonal_change"
  | "fertility_estimates_disabled"
  | "predictions_disabled";

export interface OvulationEstimate extends CalendarDateRange {
  likelyDate: LocalDateString;
  confidence: PredictionConfidence;
  evidence: PredictionReason[];
  retrospective: boolean;
}

export interface CycleCalendarPrediction {
  /** Data mais provavel; mantida com os nomes antigos para facilitar a UI. */
  startDate: LocalDateString;
  /** Termino mais provavel do proximo sangramento. */
  endDate: LocalDateString;
  periodStartRange: CalendarDateRange;
  periodEndRange: CalendarDateRange;
  averageCycleLength: number;
  averagePeriodLength: number;
  basedOnCycles: number;
  observedIntervals: number;
  variabilityDays: number | null;
  confidence: PredictionConfidence;
  reasons: PredictionReason[];
  predictionAvailable: boolean;
  fertilityEstimateAvailable: boolean;
  fertileWindow: CalendarDateRange | null;
  ovulation: OvulationEstimate | null;
  generatedAt: string;
}

export interface PhaseForDate {
  phase: CyclePhase;
  isEstimated: boolean;
  confidence: PredictionConfidence;
  fertilityLevel: FertilityLevel;
}

export interface PredictionBacktestMetrics {
  samples: number;
  lastAbsoluteErrorDays: number | null;
  meanAbsoluteErrorDays: number | null;
  medianAbsoluteErrorDays: number | null;
  meanBiasDays: number | null;
  withinOneDayPercent: number | null;
  withinTwoDaysPercent: number | null;
  withinThreeDaysPercent: number | null;
  intervalCoveragePercent: number | null;
  averageIntervalWidthDays: number | null;
}

export type CycleVariability = "unknown" | "low" | "moderate" | "high";

export interface CycleHistoryMetrics {
  recordedPeriods: number;
  observedCycleIntervals: number;
  medianCycleLength: number | null;
  averageCycleLength: number | null;
  shortestCycleLength: number | null;
  longestCycleLength: number | null;
  medianPeriodLength: number | null;
  shortestPeriodLength: number | null;
  longestPeriodLength: number | null;
  medianConsecutiveDifferenceDays: number | null;
  medianAbsoluteDeviationDays: number | null;
  variability: CycleVariability;
  backtest: PredictionBacktestMetrics;
}

export interface FertilityContextForDate {
  level: FertilityLevel;
  confidence: PredictionConfidence;
  relationRecorded: boolean;
  unprotectedVaginalSexRecorded: boolean;
  messageKey:
    | "unknown"
    | "outside_estimated_window"
    | "inside_possible_window"
    | "inside_higher_window"
    | "relation_inside_possible_window";
}
