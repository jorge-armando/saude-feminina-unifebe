const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const ts = require("typescript");

const storage = new Map();
const asyncStorage = {
  async getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  async setItem(key, value) {
    storage.set(key, value);
  },
  async removeItem(key) {
    storage.delete(key);
  },
  async multiGet(keys) {
    return keys.map((key) => [key, storage.has(key) ? storage.get(key) : null]);
  },
  async multiSet(entries) {
    entries.forEach(([key, value]) => storage.set(key, value));
  },
  async multiRemove(keys) {
    keys.forEach((key) => storage.delete(key));
  },
};

const originalLoad = Module._load;
Module._load = function load(request, parent, isMain) {
  if (request === "@react-native-async-storage/async-storage") {
    return { __esModule: true, default: asyncStorage };
  }
  return originalLoad.call(this, request, parent, isMain);
};

require.extensions[".ts"] = function transpileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const {
  calculateCycleHistoryMetrics,
  calculateCyclePredictionV2,
  getFertilityContextForDate,
  getPhaseForDate,
} = require("../services/cyclePrediction.ts");
const {
  addSexualActivity,
  createEmptyCycleCalendarState,
  loadCycleCalendarState,
  resetCycleCalendarData,
  upsertDailyEntry,
} = require("../services/cycleCalendar.ts");
const {
  CALENDAR_NOTES_STORAGE_KEY,
} = require("../services/calendarNotes.ts");
const {
  MENSTRUAL_CYCLES_STORAGE_KEY,
} = require("../services/menstrualCycle.ts");

const now = "2026-06-01T12:00:00.000Z";

function period(index, startDate, endDate) {
  return {
    id: `period-${index}`,
    startDate,
    endDate,
    source: "legacy",
    createdAt: now,
    updatedAt: now,
  };
}

function dailyEntry(date, fertility = {}, sexualActivities = []) {
  return {
    id: `daily:${date}`,
    date,
    symptoms: {},
    moods: [],
    fertility,
    sexualActivityStatus: sexualActivities.length ? "activity" : "not_reported",
    sexualActivities,
    medications: [],
    factors: {},
    notes: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function run() {
  const empty = createEmptyCycleCalendarState(now);
  assert.equal(calculateCyclePredictionV2(empty), null);

  const state = createEmptyCycleCalendarState(now);
  state.periods = [
    period(1, "2026-01-01", "2026-01-05"),
    period(2, "2026-01-29", "2026-02-02"),
    period(3, "2026-02-26", "2026-03-02"),
    period(4, "2026-03-26", "2026-03-30"),
    period(5, "2026-04-23", "2026-04-27"),
    period(6, "2026-05-21", "2026-05-25"),
  ];

  const prediction = calculateCyclePredictionV2(state);
  assert.ok(prediction);
  assert.equal(prediction.startDate, "2026-06-18");
  assert.equal(prediction.averageCycleLength, 28);
  assert.equal(prediction.confidence, "high");
  assert.equal(prediction.predictionAvailable, true);
  assert.equal(prediction.fertilityEstimateAvailable, true);

  const metrics = calculateCycleHistoryMetrics(state);
  assert.equal(metrics.medianCycleLength, 28);
  assert.equal(metrics.backtest.medianAbsoluteErrorDays, 0);

  state.entries = [dailyEntry("2026-06-03", { ovulationTest: "positive" })];
  const lhPrediction = calculateCyclePredictionV2(state);
  assert.ok(lhPrediction.ovulation.evidence.includes("positive_lh_test"));
  assert.equal(lhPrediction.ovulation.likelyDate, "2026-06-04");
  assert.equal(
    getPhaseForDate("2026-06-04", lhPrediction, state.periods).phase,
    "estimated_ovulation",
  );

  state.entries.push(
    dailyEntry("2026-06-04", {}, [
      {
        id: "sex-1",
        kind: "vaginal",
        protection: "none",
        ejaculationExposure: "unknown",
        createdAt: now,
        updatedAt: now,
      },
    ]),
  );
  assert.equal(
    getFertilityContextForDate("2026-06-04", state, lhPrediction).messageKey,
    "relation_inside_possible_window",
  );

  state.factors.usesHormonalContraception = true;
  state.factors.contraceptiveMethod = "combined_pill";
  assert.equal(calculateCyclePredictionV2(state).predictionAvailable, false);

  storage.clear();
  await asyncStorage.setItem(
    MENSTRUAL_CYCLES_STORAGE_KEY,
    JSON.stringify([
      {
        id: "legacy-1",
        startDate: "2026-01-01",
        endDate: "2026-01-05",
        createdAt: now,
      },
      {
        id: "legacy-2",
        startDate: "2026-01-29",
        endDate: "2026-02-02",
        createdAt: now,
      },
    ]),
  );
  await asyncStorage.setItem(
    CALENDAR_NOTES_STORAGE_KEY,
    JSON.stringify([
      { id: "note-1", date: "2026-01-10", note: "Teste", symptoms: [], emoji: "📝" },
    ]),
  );

  let storedState = await loadCycleCalendarState();
  assert.equal(storedState.periods.length, 2);
  assert.equal(storedState.entries[0].notes.length, 1);

  await upsertDailyEntry("2026-02-01", {
    moods: ["Feliz"],
    sexualActivityStatus: "none",
  });
  await addSexualActivity("2026-02-01", {
    kind: "vaginal",
    protection: "condom",
  });
  storedState = await loadCycleCalendarState();
  assert.equal(
    storedState.entries.find((entry) => entry.date === "2026-02-01").sexualActivityStatus,
    "activity",
  );

  await resetCycleCalendarData();
  storedState = await loadCycleCalendarState();
  assert.equal(storedState.periods.length, 2);
  assert.equal(storedState.entries.length, 1);
  assert.equal(storedState.entries[0].notes[0].text, "Teste");

  console.log("Cycle engine smoke tests passed.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
