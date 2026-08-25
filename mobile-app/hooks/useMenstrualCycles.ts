import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  calculateCyclePrediction,
  createMenstrualCycleRecord,
  loadMenstrualCycles,
  MenstrualCycleRecord,
  rangesOverlap,
  saveMenstrualCycles,
  sortCyclesNewestFirst,
} from "../services/menstrualCycle";

const STORAGE_ERROR_MESSAGE =
  "Não foi possível acessar os registros salvos neste aparelho.";

class MenstrualCycleOverlapError extends Error {
  constructor() {
    super("O período coincide com um registro existente.");
    this.name = "MenstrualCycleOverlapError";
  }
}

export function useMenstrualCycles() {
  const isFocused = useIsFocused();
  const [records, setRecords] = useState<MenstrualCycleRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const storedRecords = await loadMenstrualCycles();
      setRecords(storedRecords);
      setError(null);
    } catch {
      setError(STORAGE_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      void refresh();
    }
  }, [isFocused, refresh]);

  const addRecord = useCallback(
    async (startDate: string, endDate: string) => {
      setIsSaving(true);

      try {
        const newRecord = createMenstrualCycleRecord(startDate, endDate);
        const storedRecords = await loadMenstrualCycles();

        if (
          storedRecords.some((record) =>
            rangesOverlap(
              startDate,
              endDate,
              record.startDate,
              record.endDate
            )
          )
        ) {
          throw new MenstrualCycleOverlapError();
        }

        const nextRecords = sortCyclesNewestFirst([
          ...storedRecords,
          newRecord,
        ]);
        await saveMenstrualCycles(nextRecords);
        setRecords(nextRecords);
        setError(null);
        return newRecord;
      } catch (saveError) {
        if (!(saveError instanceof MenstrualCycleOverlapError)) {
          setError(STORAGE_ERROR_MESSAGE);
        }
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const removeRecord = useCallback(
    async (recordId: string) => {
      setIsSaving(true);

      try {
        const storedRecords = await loadMenstrualCycles();
        const nextRecords = storedRecords.filter(
          (record) => record.id !== recordId
        );
        await saveMenstrualCycles(nextRecords);
        setRecords(nextRecords);
        setError(null);
      } catch (saveError) {
        setError(STORAGE_ERROR_MESSAGE);
        throw saveError;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const prediction = useMemo(
    () => calculateCyclePrediction(records),
    [records]
  );

  return {
    records,
    prediction,
    isLoading,
    isSaving,
    error,
    refresh,
    addRecord,
    removeRecord,
  };
}
