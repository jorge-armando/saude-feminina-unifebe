import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MenstrualCycleRecord } from "./menstrualCycle";
import {
  addCycleNote as addStoredCycleNote,
  addPeriod as addStoredPeriod,
  addSexualActivity as addStoredSexualActivity,
  createEmptyCycleCalendarState,
  deleteCycleNote as deleteStoredCycleNote,
  deleteDailyEntry as deleteStoredDailyEntry,
  deletePeriod as deleteStoredPeriod,
  deleteSexualActivity as deleteStoredSexualActivity,
  loadCycleCalendarState,
  mergeLegacyPeriodsIntoState,
  resetCycleCalendarData,
  updateCycleFactors,
  updateCycleNote as updateStoredCycleNote,
  updateCycleSettings,
  updatePeriod as updateStoredPeriod,
  updateSexualActivity as updateStoredSexualActivity,
  upsertDailyEntry as upsertStoredDailyEntry,
  CycleNoteInput,
} from "./cycleCalendar";
import {
  calculateCycleHistoryMetrics,
  calculateCyclePredictionV2,
  getEntryForDate as findEntryForDate,
  getFertilityContextForDate,
  getPhaseForDate as calculatePhaseForDate,
} from "./cyclePrediction";
import {
  CycleCalendarState,
  CycleContextFactorsUpdate,
  CyclePeriodRecord,
  CycleTrackingSettings,
  DailyCycleEntryUpdate,
  SexualActivityInput,
} from "../types/cycleCalendar";

const STORAGE_ERROR_MESSAGE =
  "Nao foi possivel acessar os dados do calendario neste aparelho.";

function readableError(error: unknown) {
  return error instanceof Error && error.message
    ? error.message
    : STORAGE_ERROR_MESSAGE;
}

export function useCycleTracking(externalCycles?: MenstrualCycleRecord[]) {
  const [storedState, setStoredState] = useState<CycleCalendarState>(() =>
    createEmptyCycleCalendarState(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(false);
  const requestRef = useRef(0);
  const pendingMutationsRef = useRef(0);
  const externalCyclesRef = useRef(externalCycles);
  externalCyclesRef.current = externalCycles;

  const cycleFingerprint = useMemo(
    () =>
      (externalCycles ?? [])
        .map(
          (cycle) =>
            `${cycle.id}:${cycle.startDate}:${cycle.endDate}:${cycle.createdAt}`,
        )
        .sort()
        .join("|"),
    [externalCycles],
  );

  const mergeExternalCycles = useCallback((state: CycleCalendarState) => {
    const cycles = externalCyclesRef.current;
    return cycles ? mergeLegacyPeriodsIntoState(state, cycles) : state;
  }, []);

  const refresh = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    if (mountedRef.current) setIsLoading(true);
    try {
      const loaded = await loadCycleCalendarState();
      if (mountedRef.current && requestRef.current === requestId) {
        setStoredState(mergeExternalCycles(loaded));
        setError(null);
      }
      return loaded;
    } catch (refreshError) {
      if (mountedRef.current && requestRef.current === requestId) {
        setError(readableError(refreshError));
      }
      throw refreshError;
    } finally {
      if (mountedRef.current && requestRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, [mergeExternalCycles]);

  useEffect(() => {
    mountedRef.current = true;
    void refresh().catch(() => undefined);
    return () => {
      mountedRef.current = false;
      requestRef.current += 1;
    };
  }, [refresh]);

  useEffect(() => {
    if (!mountedRef.current || isLoading) return;
    setStoredState((current) => mergeExternalCycles(current));
  }, [cycleFingerprint, isLoading, mergeExternalCycles]);

  const runMutation = useCallback(
    async (operation: () => Promise<CycleCalendarState>) => {
      pendingMutationsRef.current += 1;
      if (mountedRef.current) setIsSaving(true);
      try {
        const next = await operation();
        if (mountedRef.current) {
          setStoredState(mergeExternalCycles(next));
          setError(null);
        }
        return next;
      } catch (mutationError) {
        if (mountedRef.current) setError(readableError(mutationError));
        throw mutationError;
      } finally {
        pendingMutationsRef.current = Math.max(
          0,
          pendingMutationsRef.current - 1,
        );
        if (mountedRef.current && pendingMutationsRef.current === 0) {
          setIsSaving(false);
        }
      }
    },
    [mergeExternalCycles],
  );

  const upsertDailyEntry = useCallback(
    (date: string, update: DailyCycleEntryUpdate) =>
      runMutation(() => upsertStoredDailyEntry(date, update)),
    [runMutation],
  );
  const deleteDailyEntry = useCallback(
    (date: string) => runMutation(() => deleteStoredDailyEntry(date)),
    [runMutation],
  );
  const addSexualActivity = useCallback(
    (date: string, input: SexualActivityInput) =>
      runMutation(() => addStoredSexualActivity(date, input)),
    [runMutation],
  );
  const updateSexualActivity = useCallback(
    (date: string, activityId: string, update: Partial<SexualActivityInput>) =>
      runMutation(() =>
        updateStoredSexualActivity(date, activityId, update),
      ),
    [runMutation],
  );
  const deleteSexualActivity = useCallback(
    (date: string, activityId: string) =>
      runMutation(() => deleteStoredSexualActivity(date, activityId)),
    [runMutation],
  );
  const updateSettings = useCallback(
    (update: Partial<CycleTrackingSettings>) =>
      runMutation(() => updateCycleSettings(update)),
    [runMutation],
  );
  const updateFactors = useCallback(
    (update: CycleContextFactorsUpdate) =>
      runMutation(() => updateCycleFactors(update)),
    [runMutation],
  );
  const addPeriod = useCallback(
    (startDate: string, endDate: string) =>
      runMutation(() => addStoredPeriod(startDate, endDate)),
    [runMutation],
  );
  const updatePeriod = useCallback(
    (
      periodId: string,
      update: Partial<Pick<CyclePeriodRecord, "startDate" | "endDate">>,
    ) => runMutation(() => updateStoredPeriod(periodId, update)),
    [runMutation],
  );
  const deletePeriod = useCallback(
    (periodId: string) => runMutation(() => deleteStoredPeriod(periodId)),
    [runMutation],
  );
  const addCycleNote = useCallback(
    (date: string, input: CycleNoteInput) =>
      runMutation(() => addStoredCycleNote(date, input)),
    [runMutation],
  );
  const updateCycleNote = useCallback(
    (date: string, noteId: string, input: Partial<CycleNoteInput>) =>
      runMutation(() => updateStoredCycleNote(date, noteId, input)),
    [runMutation],
  );
  const deleteCycleNote = useCallback(
    (date: string, noteId: string) =>
      runMutation(() => deleteStoredCycleNote(date, noteId)),
    [runMutation],
  );
  const resetTrackingData = useCallback(
    () => runMutation(() => resetCycleCalendarData()),
    [runMutation],
  );

  const prediction = useMemo(
    () => calculateCyclePredictionV2(storedState),
    [storedState],
  );
  const historyMetrics = useMemo(
    () => calculateCycleHistoryMetrics(storedState),
    [storedState],
  );
  const getEntryForDate = useCallback(
    (date: string) => findEntryForDate(storedState, date),
    [storedState],
  );
  const getPhaseForDate = useCallback(
    (date: string) =>
      calculatePhaseForDate(date, prediction, storedState.periods),
    [prediction, storedState.periods],
  );
  const getFertilityContext = useCallback(
    (date: string) =>
      getFertilityContextForDate(date, storedState, prediction),
    [prediction, storedState],
  );

  return {
    state: storedState,
    records: storedState.periods,
    entries: storedState.entries,
    settings: storedState.settings,
    factors: storedState.factors,
    prediction,
    historyMetrics,
    isLoading,
    isSaving,
    error,
    refresh,
    getEntryForDate,
    getPhaseForDate,
    getFertilityContextForDate: getFertilityContext,
    upsertDailyEntry,
    deleteDailyEntry,
    addSexualActivity,
    updateSexualActivity,
    deleteSexualActivity,
    updateSettings,
    updateFactors,
    addPeriod,
    updatePeriod,
    deletePeriod,
    addCycleNote,
    updateCycleNote,
    deleteCycleNote,
    resetTrackingData,
  };
}
