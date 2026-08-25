import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ComponentProps, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  compareLocalDates,
  daysBetween,
  formatLongDate,
  formatShortDate,
} from "../../services/menstrualCycle";
import { useCycleTracking } from "../../services/useCycleTracking";
import {
  AgeGroup,
  BleedingFlow,
  CervicalMucus,
  ContraceptiveAdherence,
  ContraceptiveMethod,
  CycleGoal,
  CyclePhase,
  CycleSymptom,
  DailyScale,
  EjaculationExposure,
  OvulationTestResult,
  PredictionConfidence,
  PregnancyTestResult,
  SexualActivityKind,
  SexualActivityStatus,
  SexualProtection,
  StressLevel,
  SymptomSeverity,
  TemperatureReliability,
} from "../../types/cycleCalendar";

type TrackingController = ReturnType<typeof useCycleTracking>;
type IconName = ComponentProps<typeof Ionicons>["name"];

interface CycleTrackingPanelProps {
  selectedDate: string;
  today: string;
  tracking: TrackingController;
  tutorialTargetRef?: (node: View | null) => void;
}

interface SelectOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

const FLOW_OPTIONS: SelectOption<BleedingFlow>[] = [
  { value: "spotting", label: "Escape" },
  { value: "light", label: "Leve" },
  { value: "medium", label: "Médio" },
  { value: "heavy", label: "Intenso" },
];

const SYMPTOM_OPTIONS: SelectOption<CycleSymptom>[] = [
  { value: "cramps", label: "Cólica" },
  { value: "pelvic_pain", label: "Dor pélvica" },
  { value: "headache", label: "Dor de cabeça" },
  { value: "back_pain", label: "Dor nas costas" },
  { value: "breast_tenderness", label: "Seios sensíveis" },
  { value: "bloating", label: "Inchaço" },
  { value: "acne", label: "Acne" },
  { value: "nausea", label: "Náusea" },
  { value: "fatigue", label: "Fadiga" },
  { value: "digestive_changes", label: "Digestão" },
];

const MOOD_OPTIONS = [
  "Tranquila",
  "Feliz",
  "Sensível",
  "Ansiosa",
  "Irritada",
  "Triste",
] as const;

const MUCUS_OPTIONS: SelectOption<CervicalMucus>[] = [
  { value: "dry", label: "Seco" },
  { value: "sticky", label: "Pegajoso" },
  { value: "creamy", label: "Cremoso" },
  { value: "watery", label: "Aquoso" },
  { value: "egg_white", label: "Transparente/elástico" },
];

const LH_OPTIONS: SelectOption<OvulationTestResult>[] = [
  { value: "negative", label: "Negativo" },
  { value: "positive", label: "Positivo" },
  { value: "peak", label: "Pico" },
  { value: "unclear", label: "Inconclusivo" },
];

const PREGNANCY_TEST_OPTIONS: SelectOption<PregnancyTestResult>[] = [
  { value: "negative", label: "Negativo" },
  { value: "positive", label: "Positivo" },
  { value: "unclear", label: "Inconclusivo" },
];

const PROTECTION_OPTIONS: SelectOption<SexualProtection>[] = [
  { value: "not_reported", label: "Prefiro não informar" },
  { value: "none", label: "Sem método" },
  { value: "condom", label: "Preservativo" },
  { value: "condom_failure", label: "Preservativo falhou" },
  { value: "other_contraception", label: "Outro contraceptivo" },
];

const CONTRACEPTIVE_METHOD_OPTIONS: SelectOption<ContraceptiveMethod>[] = [
  { value: "not_reported", label: "Prefiro não informar" },
  { value: "none", label: "Nenhum" },
  { value: "combined_pill", label: "Pílula" },
  { value: "progestin_pill", label: "Minipílula" },
  { value: "hormonal_iud", label: "DIU hormonal" },
  { value: "copper_iud", label: "DIU de cobre" },
  { value: "implant", label: "Implante" },
  { value: "injection", label: "Injeção" },
  { value: "patch", label: "Adesivo" },
  { value: "ring", label: "Anel" },
  { value: "condom", label: "Preservativo" },
  { value: "other", label: "Outro" },
];

const HORMONAL_METHODS = new Set<ContraceptiveMethod>([
  "combined_pill",
  "progestin_pill",
  "hormonal_iud",
  "implant",
  "injection",
  "patch",
  "ring",
]);

const ADHERENCE_METHODS = new Set<ContraceptiveMethod>([
  "combined_pill",
  "progestin_pill",
  "injection",
  "patch",
  "ring",
]);

const PHASES: { value: CyclePhase; label: string; color: string }[] = [
  { value: "recorded_period", label: "Menstruação", color: "#e11d48" },
  { value: "follicular", label: "Folicular", color: "#f59e0b" },
  { value: "fertile_window", label: "Janela fértil", color: "#10b981" },
  { value: "estimated_ovulation", label: "Ovulação", color: "#7c3aed" },
  { value: "luteal", label: "Lútea", color: "#6366f1" },
];

const CONFIDENCE_LABELS: Record<PredictionConfidence, string> = {
  insufficient: "Poucos dados",
  low: "Baixa",
  medium: "Moderada",
  high: "Alta",
};

const SEVERITY_LABELS: Record<SymptomSeverity, string> = {
  mild: "leve",
  moderate: "moderado",
  severe: "intenso",
};

const VARIABILITY_LABELS = {
  unknown: "Aprendendo",
  low: "Baixa",
  moderate: "Moderada",
  high: "Alta",
} as const;

function formatDateRange(startDate: string, endDate: string) {
  return startDate === endDate
    ? formatLongDate(startDate)
    : `${formatShortDate(startDate)} a ${formatShortDate(endDate)}`;
}

function getPhaseLabel(phase: CyclePhase) {
  if (phase === "predicted_period") return "Menstruação prevista";
  if (phase === "unknown") return "Fase ainda desconhecida";
  return PHASES.find((item) => item.value === phase)?.label ?? "Fase estimada";
}

function getFertilityCopy(
  messageKey: ReturnType<TrackingController["getFertilityContextForDate"]>["messageKey"],
) {
  switch (messageKey) {
    case "relation_inside_possible_window":
      return "Há uma relação registrada próxima à janela fértil estimada. Existe possibilidade de gravidez, mas o calendário não calcula um risco individual.";
    case "inside_higher_window":
      return "Esta data está próxima à ovulação estimada, quando a fertilidade pode estar mais elevada.";
    case "inside_possible_window":
      return "Esta data está dentro da janela fértil estimada.";
    case "outside_estimated_window":
      return "Esta data está fora da janela fértil estimada, mas isso não significa ausência de possibilidade de gravidez.";
    default:
      return "Ainda não há dados suficientes para estimar a fertilidade desta data.";
  }
}

function getPredictionReasonLabel(reason: string) {
  const labels: Record<string, string> = {
    population_fallback: "estimativa inicial de 28 dias",
    few_cycles: "poucos ciclos registrados",
    stable_history: "histórico com boa consistência",
    variable_history: "histórico variável",
    positive_lh_test: "teste de LH positivo",
    fertile_cervical_mucus: "muco fértil registrado",
    temperature_shift: "elevação sustentada de temperatura",
    hormonal_contraception: "contraceptivo hormonal",
    pregnancy: "gestação informada",
    postpartum: "pós-parto informado",
    breastfeeding: "amamentação informada",
    perimenopause: "perimenopausa informada",
    recent_hormonal_change: "mudança hormonal recente",
    fertility_estimates_disabled: "fertilidade desativada",
    predictions_disabled: "previsões desativadas",
  };
  return labels[reason] ?? reason;
}

function OptionChips<T extends string>({
  allowClear = true,
  options,
  value,
  onChange,
}: {
  allowClear?: boolean;
  options: SelectOption<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            activeOpacity={0.75}
            onPress={() => onChange(selected && allowClear ? undefined : option.value)}
            style={[styles.chip, selected && styles.chipSelected]}
          >
            {option.icon ? (
              <Ionicons
                name={option.icon}
                size={15}
                color={selected ? "#ffffff" : "#6b21a8"}
              />
            ) : null}
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ScalePicker({
  label,
  lowLabel,
  highLabel,
  value,
  onChange,
}: {
  label: string;
  lowLabel: string;
  highLabel: string;
  value: DailyScale | undefined;
  onChange: (value: DailyScale | undefined) => void;
}) {
  return (
    <View style={styles.scaleBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.scaleRow}>
        <Text style={styles.scaleEdge}>{lowLabel}</Text>
        {([1, 2, 3, 4, 5] as DailyScale[]).map((item) => (
          <TouchableOpacity
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === item }}
            onPress={() => onChange(value === item ? undefined : item)}
            style={[styles.scaleButton, value === item && styles.scaleButtonSelected]}
          >
            <Text style={[styles.scaleText, value === item && styles.scaleTextSelected]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.scaleEdge}>{highLabel}</Text>
      </View>
    </View>
  );
}

function SettingsSwitch({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        thumbColor="#ffffff"
        trackColor={{ false: "#d1d5db", true: "#c084fc" }}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

export function CycleTrackingPanel({
  selectedDate,
  today,
  tracking,
  tutorialTargetRef,
}: CycleTrackingPanelProps) {
  const entry = tracking.getEntryForDate(selectedDate);
  const phase = tracking.getPhaseForDate(selectedDate);
  const fertility = tracking.getFertilityContextForDate(selectedDate);
  const prediction = tracking.prediction;
  const metrics = tracking.historyMetrics;
  const selectedDateIsFuture = compareLocalDates(selectedDate, today) > 0;
  const [isQuickLogVisible, setIsQuickLogVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [panelError, setPanelError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bleeding, setBleeding] = useState<BleedingFlow | undefined>();
  const [symptoms, setSymptoms] = useState<
    Partial<Record<CycleSymptom, SymptomSeverity>>
  >({});
  const [moods, setMoods] = useState<string[]>([]);
  const [energy, setEnergy] = useState<DailyScale | undefined>();
  const [sleep, setSleep] = useState<DailyScale | undefined>();
  const [libido, setLibido] = useState<DailyScale | undefined>();
  const [mucus, setMucus] = useState<CervicalMucus | undefined>();
  const [temperature, setTemperature] = useState("");
  const [temperatureTime, setTemperatureTime] = useState("");
  const [temperatureReliability, setTemperatureReliability] =
    useState<TemperatureReliability>("reliable");
  const [ovulationTest, setOvulationTest] =
    useState<OvulationTestResult | undefined>();
  const [pregnancyTest, setPregnancyTest] =
    useState<PregnancyTestResult | undefined>();
  const [medications, setMedications] = useState("");
  const [dailyNotes, setDailyNotes] = useState("");
  const [stress, setStress] = useState<StressLevel | undefined>();
  const [illness, setIllness] = useState(false);
  const [fever, setFever] = useState(false);
  const [poorSleep, setPoorSleep] = useState(false);
  const [travel, setTravel] = useState(false);
  const [medicationChange, setMedicationChange] = useState(false);
  const [emergencyContraception, setEmergencyContraception] = useState(false);
  const [contraceptiveAdherence, setContraceptiveAdherence] =
    useState<ContraceptiveAdherence | undefined>();
  const [sexStatus, setSexStatus] =
    useState<SexualActivityStatus>("not_reported");
  const [sexKind, setSexKind] = useState<SexualActivityKind>("vaginal");
  const [protection, setProtection] =
    useState<SexualProtection>("not_reported");
  const [ejaculation, setEjaculation] =
    useState<EjaculationExposure>("unknown");
  const [tryingToConceive, setTryingToConceive] = useState(false);
  const [sexNote, setSexNote] = useState("");

  const selectedPhaseColor =
    PHASES.find((item) => item.value === phase.phase)?.color ?? "#7c3aed";
  const predictionRange = prediction?.predictionAvailable
    ? formatDateRange(
        prediction.periodStartRange.startDate,
        prediction.periodStartRange.endDate,
      )
    : null;
  const dailySummary = useMemo(() => {
    if (!entry) return "Nenhum detalhe registrado nesta data";
    let count = 0;
    if (entry.bleeding) count += 1;
    count += Object.keys(entry.symptoms).length;
    count += entry.moods.length;
    if (entry.energy || entry.sleep || entry.libido) count += 1;
    if (Object.keys(entry.fertility).length > 0) count += 1;
    if (entry.sexualActivityStatus !== "not_reported") count += 1;
    if (entry.medications.length > 0 || Object.keys(entry.factors).length > 0) count += 1;
    return count === 0
      ? "Nenhum detalhe registrado nesta data"
      : `${count} ${count === 1 ? "grupo registrado" : "grupos registrados"} nesta data`;
  }, [entry]);
  const recentCycleLengths = useMemo(() => {
    const periods = [...tracking.records].sort((first, second) =>
      first.startDate.localeCompare(second.startDate),
    );
    return periods
      .slice(1)
      .map((period, index) => ({
        date: period.startDate,
        length: daysBetween(periods[index].startDate, period.startDate),
      }))
      .filter((item) => item.length > 0)
      .slice(-6);
  }, [tracking.records]);
  const commonSymptoms = useMemo(() => {
    const counts = new Map<CycleSymptom, number>();
    tracking.entries.forEach((dailyEntry) => {
      Object.keys(dailyEntry.symptoms).forEach((symptom) => {
        const key = symptom as CycleSymptom;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });
    });
    return [...counts.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 3)
      .map(([symptom, count]) => ({
        label: SYMPTOM_OPTIONS.find((item) => item.value === symptom)?.label ?? symptom,
        count,
      }));
  }, [tracking.entries]);
  const healthNotice = useMemo(() => {
    const ageGroup = tracking.settings.ageGroup;
    const minimum = 21;
    const maximum = ageGroup === "teen" ? 45 : ageGroup === "adult" ? 35 : null;
    if (
      maximum &&
      ((metrics.shortestCycleLength !== null && metrics.shortestCycleLength < minimum) ||
        (metrics.longestCycleLength !== null && metrics.longestCycleLength > maximum))
    ) {
      return "Alguns ciclos ficaram fora da faixa habitual informativa para sua faixa etária. Isso não é um diagnóstico; acompanhe o padrão e procure orientação se houver preocupação.";
    }
    if (metrics.longestPeriodLength !== null && metrics.longestPeriodLength > 7) {
      return "Há registro de sangramento com mais de 7 dias. Vale acompanhar o padrão e buscar orientação profissional se ele se repetir ou causar preocupação.";
    }
    if (metrics.variability === "high") {
      return "Seus ciclos variaram bastante. Por isso, o aplicativo amplia o intervalo previsto e reduz a confiança da janela fértil.";
    }
    return null;
  }, [metrics, tracking.settings.ageGroup]);

  const openQuickLog = () => {
    if (selectedDateIsFuture) {
      Alert.alert(
        "Data futura",
        "Escolha hoje ou uma data anterior para registrar informações que aconteceram.",
      );
      return;
    }
    const firstSexualActivity = entry?.sexualActivities[0];
    setBleeding(entry?.bleeding);
    setSymptoms(entry?.symptoms ?? {});
    setMoods(entry?.moods ?? []);
    setEnergy(entry?.energy);
    setSleep(entry?.sleep);
    setLibido(entry?.libido);
    setMucus(entry?.fertility.cervicalMucus);
    setTemperature(
      entry?.fertility.basalTemperatureCelsius?.toLocaleString("pt-BR", {
        maximumFractionDigits: 2,
      }) ?? "",
    );
    setTemperatureTime(entry?.fertility.basalTemperatureTime ?? "");
    setTemperatureReliability(
      entry?.fertility.temperatureReliability ?? "reliable",
    );
    setOvulationTest(entry?.fertility.ovulationTest);
    setPregnancyTest(entry?.fertility.pregnancyTest);
    setMedications(entry?.medications.join(", ") ?? "");
    setDailyNotes(entry?.factors.notes ?? "");
    setStress(entry?.factors.stress);
    setIllness(Boolean(entry?.factors.illness));
    setFever(Boolean(entry?.factors.fever));
    setPoorSleep(Boolean(entry?.factors.poorSleep));
    setTravel(Boolean(entry?.factors.travel));
    setMedicationChange(Boolean(entry?.factors.medicationChange));
    setEmergencyContraception(Boolean(entry?.factors.emergencyContraception));
    setContraceptiveAdherence(entry?.factors.contraceptiveAdherence);
    setSexStatus(entry?.sexualActivityStatus ?? "not_reported");
    setSexKind(firstSexualActivity?.kind ?? "vaginal");
    setProtection(firstSexualActivity?.protection ?? "not_reported");
    setEjaculation(firstSexualActivity?.ejaculationExposure ?? "unknown");
    setTryingToConceive(Boolean(firstSexualActivity?.tryingToConceive));
    setSexNote(firstSexualActivity?.note ?? "");
    setPanelError(null);
    setIsQuickLogVisible(true);
  };

  const toggleSymptom = (symptom: CycleSymptom) => {
    setSymptoms((current) => {
      const severity = current[symptom];
      const nextSeverity: SymptomSeverity | undefined =
        severity === undefined
          ? "mild"
          : severity === "mild"
            ? "moderate"
            : severity === "moderate"
              ? "severe"
              : undefined;
      return { ...current, [symptom]: nextSeverity };
    });
  };

  const toggleMood = (mood: string) => {
    setMoods((current) =>
      current.includes(mood)
        ? current.filter((item) => item !== mood)
        : [...current, mood],
    );
  };

  const saveQuickLog = async () => {
    setIsSubmitting(true);
    setPanelError(null);
    try {
      const numericTemperature = temperature.trim()
        ? Number(temperature.replace(",", "."))
        : undefined;
      if (
        numericTemperature !== undefined &&
        (!Number.isFinite(numericTemperature) ||
          numericTemperature < 34 ||
          numericTemperature > 42)
      ) {
        throw new Error("Confira a temperatura basal informada.");
      }

      const symptomPatch = Object.fromEntries(
        SYMPTOM_OPTIONS.map(({ value }) => [value, symptoms[value]]),
      ) as Partial<Record<CycleSymptom, SymptomSeverity>>;

      await tracking.upsertDailyEntry(selectedDate, {
        bleeding,
        symptoms: symptomPatch,
        moods,
        energy,
        sleep,
        libido,
        fertility: {
          cervicalMucus: mucus,
          basalTemperatureCelsius: numericTemperature,
          basalTemperatureTime: temperatureTime.trim() || undefined,
          temperatureReliability:
            numericTemperature === undefined ? undefined : temperatureReliability,
          ovulationTest,
          pregnancyTest,
        },
        medications: medications
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        factors: {
          illness: illness || undefined,
          fever: fever || undefined,
          stress,
          poorSleep: poorSleep || undefined,
          travel: travel || undefined,
          medicationChange: medicationChange || undefined,
          emergencyContraception: emergencyContraception || undefined,
          contraceptiveAdherence,
          notes: dailyNotes.trim() || undefined,
        },
        sexualActivityStatus: sexStatus,
      });

      const currentActivities = entry?.sexualActivities ?? [];
      if (sexStatus === "activity") {
        const input = {
          kind: sexKind,
          protection,
          ejaculationExposure: ejaculation,
          tryingToConceive,
          note: sexNote.trim() || undefined,
        };
        if (currentActivities[0]) {
          await tracking.updateSexualActivity(
            selectedDate,
            currentActivities[0].id,
            input,
          );
        } else {
          await tracking.addSexualActivity(selectedDate, input);
        }
      } else {
        for (const activity of currentActivities) {
          await tracking.deleteSexualActivity(selectedDate, activity.id);
        }
        await tracking.upsertDailyEntry(selectedDate, {
          sexualActivityStatus: sexStatus,
        });
      }

      setIsQuickLogVisible(false);
    } catch (error) {
      setPanelError(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar os detalhes desta data.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateSettings = async (
    update: Parameters<TrackingController["updateSettings"]>[0],
  ) => {
    setPanelError(null);
    try {
      await tracking.updateSettings(update);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };

  const updateFactors = async (
    update: Parameters<TrackingController["updateFactors"]>[0],
  ) => {
    setPanelError(null);
    try {
      await tracking.updateFactors(update);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "Não foi possível salvar.");
    }
  };

  const exportData = async () => {
    try {
      await Share.share({
        title: "Exportação do calendário",
        message: JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            notice: "Este arquivo contém dados pessoais sensíveis.",
            calendar: tracking.state,
          },
          null,
          2,
        ),
      });
    } catch {
      Alert.alert("Não foi possível exportar", "Tente novamente neste aparelho.");
    }
  };

  const confirmResetTracking = () => {
    Alert.alert(
      "Apagar registros detalhados?",
      "Isso remove sintomas, testes, relações e preferências do Calendário Inteligente. Os períodos e anotações antigos continuam disponíveis.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar detalhes",
          style: "destructive",
          onPress: () => {
            void tracking
              .resetTrackingData()
              .then(() => setIsSettingsVisible(false))
              .catch(() =>
                Alert.alert("Não foi possível apagar", "Tente novamente."),
              );
          },
        },
      ],
    );
  };

  return (
    <>
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderCopy}>
            <Text style={styles.eyebrow}>CALENDÁRIO INTELIGENTE</Text>
            <Text style={styles.panelTitle}>{getPhaseLabel(phase.phase)}</Text>
            <Text style={styles.panelDate}>{formatLongDate(selectedDate)}</Text>
          </View>
          <View style={[styles.phaseIcon, { backgroundColor: `${selectedPhaseColor}18` }]}>
            <Ionicons name="analytics-outline" size={24} color={selectedPhaseColor} />
          </View>
        </View>

        <View style={styles.phaseStrip}>
          {PHASES.map((item) => {
            const active = item.value === phase.phase;
            return (
              <View key={item.value} style={styles.phaseItem}>
                <View
                  style={[
                    styles.phaseDot,
                    { backgroundColor: item.color },
                    active && styles.phaseDotActive,
                  ]}
                />
                <Text style={[styles.phaseLabel, active && styles.phaseLabelActive]}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Próxima menstruação</Text>
            <Text style={styles.summaryValue}>
              {predictionRange ?? "Previsão pausada"}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Confiança</Text>
            <Text style={styles.summaryValue}>
              {prediction
                ? CONFIDENCE_LABELS[prediction.confidence]
                : "Poucos dados"}
            </Text>
            <Text style={styles.summaryHint}>
              {prediction ? `${prediction.basedOnCycles} períodos usados` : "Registre seu período"}
            </Text>
          </View>
        </View>
        {prediction?.reasons.length ? (
          <View style={styles.reasonsRow}>
            <Text style={styles.reasonsLabel}>Por que esta previsão:</Text>
            <Text style={styles.reasonsText}>
              {prediction.reasons.map(getPredictionReasonLabel).join(" · ")}
            </Text>
          </View>
        ) : null}

        <View style={styles.fertilityCard}>
          <View style={styles.fertilityHeading}>
            <Ionicons name="leaf-outline" size={19} color="#047857" />
            <Text style={styles.fertilityTitle}>
              Fertilidade estimada: {fertility.level === "higher"
                ? "mais elevada"
                : fertility.level === "possible"
                  ? "possível"
                  : fertility.level === "low"
                    ? "baixa"
                    : "indisponível"}
            </Text>
          </View>
          <Text style={styles.fertilityText}>{getFertilityCopy(fertility.messageKey)}</Text>
        </View>

        <View style={styles.selectedSummary}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#7e22ce" />
          <Text style={styles.selectedSummaryText}>{dailySummary}</Text>
        </View>

        <View
          collapsable={false}
          ref={tutorialTargetRef}
          style={styles.actionsRow}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ disabled: selectedDateIsFuture }}
            activeOpacity={0.86}
            disabled={selectedDateIsFuture}
            style={[
              styles.primaryAction,
              selectedDateIsFuture && styles.disabledButton,
            ]}
            onPress={openQuickLog}
          >
            <LinearGradient
              colors={["#7e22ce", "#db2777"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryActionGradient}
            >
              <Ionicons name="add-circle" size={22} color="#ffffff" />
              <Text style={styles.primaryActionText}>
                {selectedDateIsFuture
                  ? "Data futura"
                  : `Registrar ${selectedDate === today ? "hoje" : "esta data"}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Configurar Calendário Inteligente"
            accessibilityRole="button"
            style={styles.settingsButton}
            onPress={() => {
              setPanelError(null);
              setIsSettingsVisible(true);
            }}
          >
            <Ionicons name="options-outline" size={22} color="#6b21a8" />
          </TouchableOpacity>
        </View>

        <View style={styles.metricsSection}>
          <Text style={styles.metricsTitle}>Seu histórico em números</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {metrics.medianCycleLength ? `${metrics.medianCycleLength}d` : "—"}
              </Text>
              <Text style={styles.metricLabel}>Ciclo mediano</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {VARIABILITY_LABELS[metrics.variability]}
              </Text>
              <Text style={styles.metricLabel}>Variação</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {metrics.backtest.medianAbsoluteErrorDays === null
                  ? "—"
                  : `${metrics.backtest.medianAbsoluteErrorDays}d`}
              </Text>
              <Text style={styles.metricLabel}>Erro mediano</Text>
            </View>
          </View>
          {recentCycleLengths.length > 1 ? (
            <View style={styles.chartBlock}>
              <Text style={styles.chartTitle}>Duração dos ciclos recentes</Text>
              <View style={styles.chart}>
                {recentCycleLengths.map((item) => {
                  const largest = Math.max(
                    ...recentCycleLengths.map((cycle) => cycle.length),
                    1,
                  );
                  return (
                    <View key={item.date} style={styles.chartColumn}>
                      <Text style={styles.chartValue}>{item.length}d</Text>
                      <View
                        style={[
                          styles.chartBar,
                          { height: Math.max(14, (item.length / largest) * 56) },
                        ]}
                      />
                      <Text style={styles.chartLabel}>{formatShortDate(item.date).slice(0, 5)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}
          {commonSymptoms.length > 0 ? (
            <View style={styles.patternRow}>
              <Ionicons name="sparkles-outline" size={17} color="#7e22ce" />
              <Text style={styles.patternText}>
                Mais registrados: {commonSymptoms
                  .map((item) => `${item.label} (${item.count})`)
                  .join(", ")}.
              </Text>
            </View>
          ) : null}
          {healthNotice ? (
            <View style={styles.healthNotice}>
              <Ionicons name="pulse-outline" size={18} color="#9a3412" />
              <Text style={styles.healthNoticeText}>{healthNotice}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={18} color="#6b21a8" />
          <Text style={styles.disclaimerText}>
            Fases e fertilidade são estimativas. Não confirmam ovulação ou gravidez e
            não devem ser usadas como único método contraceptivo.
          </Text>
        </View>
      </View>

      {panelError && !isQuickLogVisible && !isSettingsVisible ? (
        <Text accessibilityRole="alert" style={styles.inlineError}>{panelError}</Text>
      ) : null}

      <Modal
        animationType="slide"
        transparent
        visible={isQuickLogVisible}
        onRequestClose={() => setIsQuickLogVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalRoot}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setIsQuickLogVisible(false)} />
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetTitle}>Registrar detalhes</Text>
                <Text style={styles.sheetDate}>{formatLongDate(selectedDate)}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Fechar registro diário"
                style={styles.closeButton}
                onPress={() => setIsQuickLogVisible(false)}
              >
                <Ionicons name="close" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Fluxo</Text>
                <OptionChips options={FLOW_OPTIONS} value={bleeding} onChange={setBleeding} />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Sintomas</Text>
                <Text style={styles.formHelp}>
                  Toque mais vezes para marcar leve, moderado ou intenso.
                </Text>
                <View style={styles.chips}>
                  {SYMPTOM_OPTIONS.map((option) => {
                    const severity = symptoms[option.value];
                    return (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => toggleSymptom(option.value)}
                        style={[styles.chip, severity && styles.chipSelected]}
                      >
                        <Text style={[styles.chipText, severity && styles.chipTextSelected]}>
                          {option.label}{severity ? ` · ${SEVERITY_LABELS[severity]}` : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Humor</Text>
                <View style={styles.chips}>
                  {MOOD_OPTIONS.map((mood) => {
                    const selected = moods.includes(mood);
                    return (
                      <TouchableOpacity
                        key={mood}
                        onPress={() => toggleMood(mood)}
                        style={[styles.chip, selected && styles.chipSelected]}
                      >
                        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                          {mood}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Bem-estar</Text>
                <ScalePicker label="Energia" lowLabel="Baixa" highLabel="Alta" value={energy} onChange={setEnergy} />
                <ScalePicker label="Sono" lowLabel="Ruim" highLabel="Ótimo" value={sleep} onChange={setSleep} />
                <ScalePicker label="Libido" lowLabel="Baixa" highLabel="Alta" value={libido} onChange={setLibido} />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Sinais de fertilidade</Text>
                <Text style={styles.fieldLabel}>Muco cervical</Text>
                <OptionChips options={MUCUS_OPTIONS} value={mucus} onChange={setMucus} />

                <Text style={styles.fieldLabel}>Teste de ovulação (LH)</Text>
                <OptionChips options={LH_OPTIONS} value={ovulationTest} onChange={setOvulationTest} />

                <Text style={styles.fieldLabel}>Temperatura basal em °C</Text>
                <View style={styles.twoInputs}>
                  <TextInput
                    accessibilityLabel="Temperatura basal em graus Celsius"
                    keyboardType="decimal-pad"
                    maxLength={5}
                    placeholder="Ex.: 36,45"
                    placeholderTextColor="#9ca3af"
                    style={[styles.input, styles.flexInput]}
                    value={temperature}
                    onChangeText={setTemperature}
                  />
                  <TextInput
                    accessibilityLabel="Horário da temperatura basal"
                    maxLength={5}
                    placeholder="06:30"
                    placeholderTextColor="#9ca3af"
                    style={[styles.input, styles.timeInput]}
                    value={temperatureTime}
                    onChangeText={setTemperatureTime}
                  />
                </View>
                {temperature.trim() ? (
                  <OptionChips
                    allowClear={false}
                    options={[
                      { value: "reliable", label: "Medição habitual" },
                      { value: "poor_sleep", label: "Sono ruim" },
                      { value: "different_time", label: "Outro horário" },
                      { value: "illness", label: "Doença/febre" },
                      { value: "alcohol", label: "Álcool" },
                      { value: "uncertain", label: "Incerta" },
                    ]}
                    value={temperatureReliability}
                    onChange={(value) => value && setTemperatureReliability(value)}
                  />
                ) : null}

                <Text style={styles.fieldLabel}>Teste de gravidez</Text>
                <OptionChips
                  options={PREGNANCY_TEST_OPTIONS}
                  value={pregnancyTest}
                  onChange={setPregnancyTest}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Relação sexual</Text>
                <Text style={styles.formHelp}>Opcional e armazenado somente neste aparelho.</Text>
                <OptionChips
                  allowClear={false}
                  options={[
                    { value: "not_reported", label: "Prefiro não informar" },
                    { value: "none", label: "Não houve" },
                    { value: "activity", label: "Houve relação" },
                  ]}
                  value={sexStatus}
                  onChange={(value) => value && setSexStatus(value)}
                />

                {sexStatus === "activity" ? (
                  <View style={styles.nestedFields}>
                    <Text style={styles.fieldLabel}>Tipo</Text>
                    <OptionChips
                      allowClear={false}
                      options={[
                        { value: "vaginal", label: "Vaginal" },
                        { value: "other", label: "Outro contato" },
                      ]}
                      value={sexKind}
                      onChange={(value) => value && setSexKind(value)}
                    />
                    <Text style={styles.fieldLabel}>Método para prevenir gravidez</Text>
                    <OptionChips
                      allowClear={false}
                      options={PROTECTION_OPTIONS}
                      value={protection}
                      onChange={(value) => value && setProtection(value)}
                    />
                    <Text style={styles.fieldLabel}>Exposição à ejaculação</Text>
                    <OptionChips
                      allowClear={false}
                      options={[
                        { value: "unknown", label: "Prefiro não informar" },
                        { value: "yes", label: "Sim" },
                        { value: "no", label: "Não" },
                      ]}
                      value={ejaculation}
                      onChange={(value) => value && setEjaculation(value)}
                    />
                    <SettingsSwitch
                      title="Tentando engravidar"
                      description="Usado apenas para adaptar os textos da tela."
                      value={tryingToConceive}
                      onValueChange={setTryingToConceive}
                    />
                    <TextInput
                      maxLength={300}
                      multiline
                      placeholder="Observação privada (opcional)"
                      placeholderTextColor="#9ca3af"
                      style={[styles.input, styles.multilineInput]}
                      value={sexNote}
                      onChangeText={setSexNote}
                    />
                  </View>
                ) : null}
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Outros fatores</Text>
                <View style={styles.chips}>
                  {[
                    { label: "Doença", value: illness, setter: setIllness },
                    { label: "Febre", value: fever, setter: setFever },
                    { label: "Sono ruim", value: poorSleep, setter: setPoorSleep },
                    { label: "Viagem", value: travel, setter: setTravel },
                    { label: "Mudança de medicação", value: medicationChange, setter: setMedicationChange },
                    { label: "Contracepção de emergência", value: emergencyContraception, setter: setEmergencyContraception },
                  ].map((factor) => (
                    <TouchableOpacity
                      key={factor.label}
                      onPress={() => factor.setter(!factor.value)}
                      style={[styles.chip, factor.value && styles.chipSelected]}
                    >
                      <Text style={[styles.chipText, factor.value && styles.chipTextSelected]}>
                        {factor.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {ADHERENCE_METHODS.has(tracking.factors.contraceptiveMethod) ? (
                  <>
                    <Text style={styles.fieldLabel}>Uso do contraceptivo nesta data</Text>
                    <OptionChips<ContraceptiveAdherence>
                      options={[
                        { value: "on_time", label: "No horário/período certo" },
                        { value: "late", label: "Atrasado" },
                        { value: "missed", label: "Esquecido" },
                      ]}
                      value={contraceptiveAdherence}
                      onChange={setContraceptiveAdherence}
                    />
                  </>
                ) : null}
                <Text style={styles.fieldLabel}>Estresse</Text>
                <OptionChips
                  options={[
                    { value: "low", label: "Baixo" },
                    { value: "moderate", label: "Moderado" },
                    { value: "high", label: "Alto" },
                  ]}
                  value={stress}
                  onChange={setStress}
                />
                <Text style={styles.fieldLabel}>Medicamentos</Text>
                <TextInput
                  maxLength={500}
                  placeholder="Separe por vírgulas"
                  placeholderTextColor="#9ca3af"
                  style={styles.input}
                  value={medications}
                  onChangeText={setMedications}
                />
                <Text style={styles.fieldLabel}>Observação do dia</Text>
                <TextInput
                  maxLength={600}
                  multiline
                  placeholder="Algo que possa ter influenciado seu ciclo"
                  placeholderTextColor="#9ca3af"
                  style={[styles.input, styles.multilineInput]}
                  value={dailyNotes}
                  onChangeText={setDailyNotes}
                />
              </View>

              {panelError ? (
                <Text accessibilityRole="alert" style={styles.modalError}>{panelError}</Text>
              ) : null}
            </ScrollView>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
              disabled={isSubmitting}
              style={[styles.saveButton, isSubmitting && styles.disabledButton]}
              onPress={() => void saveQuickLog()}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                  <Text style={styles.saveButtonText}>Salvar registros</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={isSettingsVisible}
        onRequestClose={() => setIsSettingsVisible(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.modalOverlay} onPress={() => setIsSettingsVisible(false)} />
          <View style={styles.settingsModal} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetTitle}>Personalizar calendário</Text>
                <Text style={styles.sheetDate}>Previsão, contexto e privacidade</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Fechar configurações"
                style={styles.closeButton}
                onPress={() => setIsSettingsVisible(false)}
              >
                <Ionicons name="close" size={24} color="#4b5563" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Meu objetivo</Text>
                <OptionChips<CycleGoal>
                  allowClear={false}
                  options={[
                    { value: "track_cycle", label: "Conhecer meu ciclo" },
                    { value: "trying_to_conceive", label: "Tentar engravidar" },
                    { value: "track_fertility", label: "Acompanhar fertilidade" },
                  ]}
                  value={tracking.settings.goal}
                  onChange={(value) => value && void updateSettings({ goal: value })}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Faixa etária</Text>
                <OptionChips<AgeGroup>
                  allowClear={false}
                  options={[
                    { value: "not_reported", label: "Prefiro não informar" },
                    { value: "teen", label: "Adolescente" },
                    { value: "adult", label: "Adulta" },
                  ]}
                  value={tracking.settings.ageGroup}
                  onChange={(value) => value && void updateSettings({ ageGroup: value })}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Previsões</Text>
                <SettingsSwitch
                  title="Prever próxima menstruação"
                  description="Mostra um intervalo provável, nunca uma data garantida."
                  value={tracking.settings.predictionsEnabled}
                  onValueChange={(value) => void updateSettings({ predictionsEnabled: value })}
                />
                <SettingsSwitch
                  title="Mostrar estimativas de fertilidade"
                  description="Inclui fases, janela fértil e ovulação estimadas."
                  value={tracking.settings.fertilityEstimatesEnabled}
                  onValueChange={(value) => void updateSettings({ fertilityEstimatesEnabled: value })}
                />
                <SettingsSwitch
                  title="Mostrar marcador de relação"
                  description="Usa apenas um ponto discreto no calendário."
                  value={tracking.settings.showSexMarkers}
                  onValueChange={(value) => void updateSettings({ showSexMarkers: value })}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Contexto atual</Text>
                <Text style={styles.formHelp}>
                  Estes fatores podem pausar ou reduzir a confiança da janela fértil.
                </Text>
                <Text style={styles.fieldLabel}>Método contraceptivo habitual</Text>
                <OptionChips<ContraceptiveMethod>
                  allowClear={false}
                  options={CONTRACEPTIVE_METHOD_OPTIONS}
                  value={tracking.factors.contraceptiveMethod}
                  onChange={(value) => {
                    if (!value) return;
                    void updateFactors({
                      contraceptiveMethod: value,
                      usesHormonalContraception: HORMONAL_METHODS.has(value),
                    });
                  }}
                />
                <SettingsSwitch
                  title="Gestação"
                  description="Pausa previsões de ciclo e fertilidade."
                  value={tracking.factors.pregnant}
                  onValueChange={(value) => void updateFactors({ pregnant: value })}
                />
                <SettingsSwitch
                  title="Pós-parto"
                  description="Reduz a confiança das previsões."
                  value={tracking.factors.postpartum}
                  onValueChange={(value) => void updateFactors({ postpartum: value })}
                />
                <SettingsSwitch
                  title="Amamentação"
                  description="Pode alterar a regularidade do ciclo."
                  value={tracking.factors.breastfeeding}
                  onValueChange={(value) => void updateFactors({ breastfeeding: value })}
                />
                <SettingsSwitch
                  title="Interrupção recente de hormônios"
                  description="Mantém a previsão fértil em baixa confiança."
                  value={tracking.factors.recentlyStoppedHormonalContraception}
                  onValueChange={(value) => void updateFactors({ recentlyStoppedHormonalContraception: value })}
                />
                <SettingsSwitch
                  title="Perimenopausa"
                  description="Evita previsões férteis excessivamente confiantes."
                  value={tracking.factors.perimenopause}
                  onValueChange={(value) => void updateFactors({ perimenopause: value })}
                />
              </View>

              <View style={styles.privacyCard}>
                <Ionicons name="shield-checkmark-outline" size={24} color="#6b21a8" />
                <View style={styles.privacyCopy}>
                  <Text style={styles.privacyTitle}>Privacidade nesta versão de testes</Text>
                  <Text style={styles.privacyText}>
                    Os dados não são enviados ao servidor nem a ferramentas de analytics.
                    Eles ficam no armazenamento local do aparelho. Criptografia e bloqueio
                    biométrico ainda dependem da próxima compilação nativa.
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.utilityButton} onPress={() => void exportData()}>
                <Ionicons name="share-outline" size={20} color="#6b21a8" />
                <View style={styles.utilityCopy}>
                  <Text style={styles.utilityTitle}>Exportar meus dados</Text>
                  <Text style={styles.utilityText}>O arquivo compartilhado contém dados sensíveis.</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dangerButton} onPress={confirmResetTracking}>
                <Ionicons name="trash-outline" size={20} color="#b91c1c" />
                <View style={styles.utilityCopy}>
                  <Text style={styles.dangerTitle}>Apagar registros detalhados</Text>
                  <Text style={styles.utilityText}>Mantém períodos e anotações da versão anterior.</Text>
                </View>
              </TouchableOpacity>

              {panelError ? (
                <Text accessibilityRole="alert" style={styles.modalError}>{panelError}</Text>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "#ffffff",
    borderColor: "#e9d5ff",
    borderRadius: 28,
    borderWidth: 1,
    elevation: 5,
    padding: 18,
    shadowColor: "#7e22ce",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
  },
  panelHeader: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
  panelHeaderCopy: { flex: 1 },
  eyebrow: { color: "#7e22ce", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  panelTitle: { color: "#111827", fontSize: 22, fontWeight: "900", marginTop: 4 },
  panelDate: { color: "#6b7280", fontSize: 12, marginTop: 3 },
  phaseIcon: { alignItems: "center", borderRadius: 18, height: 48, justifyContent: "center", width: 48 },
  phaseStrip: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 17 },
  phaseItem: { alignItems: "center", flexDirection: "row", gap: 5 },
  phaseDot: { borderRadius: 999, height: 7, opacity: 0.45, width: 7 },
  phaseDotActive: { height: 10, opacity: 1, width: 10 },
  phaseLabel: { color: "#9ca3af", fontSize: 10, fontWeight: "700" },
  phaseLabelActive: { color: "#374151", fontWeight: "900" },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  summaryCard: { backgroundColor: "#faf5ff", borderRadius: 18, flex: 1, minWidth: 135, padding: 13 },
  summaryLabel: { color: "#7e22ce", fontSize: 10, fontWeight: "800", marginBottom: 5 },
  summaryValue: { color: "#111827", fontSize: 13, fontWeight: "900", lineHeight: 18 },
  summaryHint: { color: "#6b7280", fontSize: 9, marginTop: 3 },
  reasonsRow: { backgroundColor: "#f9fafb", borderRadius: 13, marginTop: 9, padding: 9 },
  reasonsLabel: { color: "#374151", fontSize: 9, fontWeight: "900" },
  reasonsText: { color: "#6b7280", fontSize: 9, lineHeight: 14, marginTop: 2 },
  fertilityCard: { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0", borderRadius: 18, borderWidth: 1, marginTop: 12, padding: 13 },
  fertilityHeading: { alignItems: "center", flexDirection: "row", gap: 7 },
  fertilityTitle: { color: "#065f46", flex: 1, fontSize: 12, fontWeight: "900" },
  fertilityText: { color: "#047857", fontSize: 11, lineHeight: 17, marginTop: 6 },
  selectedSummary: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 13 },
  selectedSummaryText: { color: "#4b5563", flex: 1, fontSize: 11 },
  actionsRow: { flexDirection: "row", gap: 9, marginTop: 14 },
  primaryAction: { borderRadius: 17, flex: 1, overflow: "hidden" },
  primaryActionGradient: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 52, paddingHorizontal: 14 },
  primaryActionText: { color: "#ffffff", fontSize: 13, fontWeight: "900" },
  settingsButton: { alignItems: "center", backgroundColor: "#f3e8ff", borderColor: "#e9d5ff", borderRadius: 17, borderWidth: 1, justifyContent: "center", width: 52 },
  metricsSection: { borderTopColor: "#f3f4f6", borderTopWidth: 1, marginTop: 18, paddingTop: 15 },
  metricsTitle: { color: "#374151", fontSize: 12, fontWeight: "900", marginBottom: 9 },
  metricsGrid: { flexDirection: "row", gap: 8 },
  metricCard: { alignItems: "center", backgroundColor: "#f9fafb", borderRadius: 14, flex: 1, paddingHorizontal: 5, paddingVertical: 10 },
  metricValue: { color: "#6b21a8", fontSize: 13, fontWeight: "900" },
  metricLabel: { color: "#6b7280", fontSize: 9, marginTop: 3, textAlign: "center" },
  chartBlock: { backgroundColor: "#faf5ff", borderRadius: 16, marginTop: 10, padding: 11 },
  chartTitle: { color: "#6b21a8", fontSize: 10, fontWeight: "900", marginBottom: 8 },
  chart: { alignItems: "flex-end", flexDirection: "row", gap: 5, justifyContent: "space-around", minHeight: 88 },
  chartColumn: { alignItems: "center", flex: 1, justifyContent: "flex-end" },
  chartValue: { color: "#6b21a8", fontSize: 8, fontWeight: "800", marginBottom: 3 },
  chartBar: { backgroundColor: "#c084fc", borderRadius: 6, maxWidth: 24, width: "70%" },
  chartLabel: { color: "#9ca3af", fontSize: 7, marginTop: 3 },
  patternRow: { alignItems: "flex-start", backgroundColor: "#faf5ff", borderRadius: 14, flexDirection: "row", gap: 7, marginTop: 9, padding: 10 },
  patternText: { color: "#6b21a8", flex: 1, fontSize: 9, lineHeight: 14 },
  healthNotice: { alignItems: "flex-start", backgroundColor: "#fff7ed", borderColor: "#fed7aa", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 7, marginTop: 9, padding: 10 },
  healthNoticeText: { color: "#9a3412", flex: 1, fontSize: 9, lineHeight: 14 },
  disclaimer: { alignItems: "flex-start", backgroundColor: "#faf5ff", borderRadius: 15, flexDirection: "row", gap: 8, marginTop: 14, padding: 11 },
  disclaimerText: { color: "#6b21a8", flex: 1, fontSize: 10, lineHeight: 15 },
  inlineError: { color: "#b91c1c", fontSize: 12, marginTop: 8 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalOverlay: { backgroundColor: "rgba(15, 23, 42, 0.52)", bottom: 0, left: 0, position: "absolute", right: 0, top: 0 },
  sheet: { alignSelf: "center", backgroundColor: "#ffffff", borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "94%", maxWidth: 760, paddingBottom: 12, width: "100%" },
  settingsModal: { alignSelf: "center", backgroundColor: "#ffffff", borderRadius: 28, maxHeight: "90%", maxWidth: 680, paddingBottom: 8, width: "94%" },
  sheetHandle: { alignSelf: "center", backgroundColor: "#d1d5db", borderRadius: 999, height: 5, marginTop: 9, width: 44 },
  sheetHeader: { alignItems: "center", borderBottomColor: "#f3f4f6", borderBottomWidth: 1, flexDirection: "row", padding: 18 },
  sheetHeaderCopy: { flex: 1 },
  sheetTitle: { color: "#111827", fontSize: 19, fontWeight: "900" },
  sheetDate: { color: "#6b7280", fontSize: 11, marginTop: 3 },
  closeButton: { alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 14, height: 42, justifyContent: "center", width: 42 },
  sheetContent: { padding: 16, paddingBottom: 30 },
  settingsContent: { padding: 16, paddingBottom: 22 },
  formSection: { backgroundColor: "#ffffff", borderColor: "#f3f4f6", borderRadius: 20, borderWidth: 1, marginBottom: 13, padding: 14 },
  formTitle: { color: "#111827", fontSize: 15, fontWeight: "900", marginBottom: 9 },
  formHelp: { color: "#6b7280", fontSize: 10, lineHeight: 15, marginBottom: 9 },
  fieldLabel: { color: "#4b5563", fontSize: 11, fontWeight: "800", marginBottom: 7, marginTop: 11 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { alignItems: "center", backgroundColor: "#faf5ff", borderColor: "#e9d5ff", borderRadius: 999, borderWidth: 1, flexDirection: "row", gap: 5, minHeight: 36, paddingHorizontal: 11, paddingVertical: 7 },
  chipSelected: { backgroundColor: "#7e22ce", borderColor: "#7e22ce" },
  chipText: { color: "#6b21a8", fontSize: 10, fontWeight: "800" },
  chipTextSelected: { color: "#ffffff" },
  scaleBlock: { marginTop: 5 },
  scaleRow: { alignItems: "center", flexDirection: "row", gap: 5 },
  scaleEdge: { color: "#9ca3af", fontSize: 8, width: 30 },
  scaleButton: { alignItems: "center", backgroundColor: "#f3f4f6", borderRadius: 999, height: 32, justifyContent: "center", width: 32 },
  scaleButtonSelected: { backgroundColor: "#7e22ce" },
  scaleText: { color: "#4b5563", fontSize: 10, fontWeight: "800" },
  scaleTextSelected: { color: "#ffffff" },
  twoInputs: { flexDirection: "row", gap: 8 },
  input: { backgroundColor: "#f9fafb", borderColor: "#e5e7eb", borderRadius: 14, borderWidth: 1, color: "#111827", fontSize: 12, minHeight: 46, paddingHorizontal: 12, paddingVertical: 10 },
  flexInput: { flex: 1 },
  timeInput: { width: 95 },
  multilineInput: { minHeight: 78, textAlignVertical: "top" },
  nestedFields: { backgroundColor: "#faf5ff", borderRadius: 16, marginTop: 10, padding: 11 },
  switchRow: { alignItems: "center", borderBottomColor: "#f3f4f6", borderBottomWidth: 1, flexDirection: "row", gap: 12, paddingVertical: 11 },
  switchCopy: { flex: 1 },
  switchTitle: { color: "#374151", fontSize: 12, fontWeight: "800" },
  switchDescription: { color: "#6b7280", fontSize: 9, lineHeight: 14, marginTop: 3 },
  modalError: { backgroundColor: "#fef2f2", borderRadius: 12, color: "#b91c1c", fontSize: 11, lineHeight: 17, marginBottom: 12, padding: 10 },
  saveButton: { alignItems: "center", alignSelf: "center", backgroundColor: "#7e22ce", borderRadius: 17, flexDirection: "row", gap: 8, justifyContent: "center", marginHorizontal: 16, minHeight: 52, width: "90%" },
  disabledButton: { opacity: 0.55 },
  saveButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "900" },
  privacyCard: { alignItems: "flex-start", backgroundColor: "#faf5ff", borderColor: "#e9d5ff", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 12, padding: 14 },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: "#6b21a8", fontSize: 12, fontWeight: "900" },
  privacyText: { color: "#6b21a8", fontSize: 10, lineHeight: 16, marginTop: 4 },
  utilityButton: { alignItems: "center", backgroundColor: "#faf5ff", borderColor: "#e9d5ff", borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 11, marginBottom: 9, padding: 13 },
  dangerButton: { alignItems: "center", backgroundColor: "#fef2f2", borderColor: "#fecaca", borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 11, marginBottom: 9, padding: 13 },
  utilityCopy: { flex: 1 },
  utilityTitle: { color: "#6b21a8", fontSize: 12, fontWeight: "900" },
  dangerTitle: { color: "#b91c1c", fontSize: 12, fontWeight: "900" },
  utilityText: { color: "#6b7280", fontSize: 9, lineHeight: 14, marginTop: 2 },
});
