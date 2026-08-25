import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ComponentRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  findNodeHandle,
  InteractionManager,
  LayoutChangeEvent,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import {
  CalendarTutorial,
  CALENDAR_TUTORIAL_STEPS,
  CalendarTutorialTarget,
} from "../../components/calendar/CalendarTutorial";
import { useMenstrualCycles } from "../../hooks/useMenstrualCycles";
import { useNavigationState } from "../../hooks/useNavigationState";
import {
  CalendarNote,
  loadCalendarNotes,
  saveCalendarNotes,
} from "../../services/calendarNotes";
import {
  compareLocalDates,
  daysBetween,
  formatLongDate,
  formatMonthYear,
  formatShortDate,
  isDateInRange,
  localDateFromParts,
  MAX_RECORDED_PERIOD_DAYS,
  MenstrualCycleRecord,
  rangesOverlap,
  toLocalDate,
} from "../../services/menstrualCycle";

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

interface VisibleMonth {
  year: number;
  monthIndex: number;
}

function getMonthGrid({ year, monthIndex }: VisibleMonth) {
  const firstWeekDay = new Date(year, monthIndex, 1).getDay();
  const numberOfDays = new Date(year, monthIndex + 1, 0).getDate();
  const numberOfCells = Math.ceil((firstWeekDay + numberOfDays) / 7) * 7;

  return Array.from({ length: numberOfCells }, (_, index) => {
    const day = index - firstWeekDay + 1;
    return day > 0 && day <= numberOfDays
      ? localDateFromParts(year, monthIndex, day)
      : null;
  });
}

function getMonthFromLocalDate(value: string): VisibleMonth {
  const [year, month] = value.split("-").map(Number);
  return { year, monthIndex: month - 1 };
}

function getCountdownLabel(numberOfDays: number, isOngoing: boolean) {
  if (numberOfDays < 0) {
    if (isOngoing) {
      return "período previsto em andamento";
    }

    const elapsedDays = Math.abs(numberOfDays);
    return elapsedDays === 1
      ? "previsão não confirmada desde ontem"
      : `previsão não confirmada há ${elapsedDays} dias`;
  }

  if (numberOfDays === 0) {
    return "prevista para hoje";
  }

  if (numberOfDays === 1) {
    return "prevista para amanhã";
  }

  return `prevista em ${numberOfDays} dias`;
}

export default function CalendarPage() {
  const scrollViewRef = useRef<ScrollView>(null);
  const tutorialButtonRef = useRef<ComponentRef<typeof TouchableOpacity>>(null);
  const restoreTutorialFocusTaskRef = useRef<ReturnType<
    typeof InteractionManager.runAfterInteractions
  > | null>(null);
  const tutorialOffsetsRef = useRef<Record<CalendarTutorialTarget, number>>({
    intro: 0,
    prediction: 0,
    calendar: 0,
    registration: 0,
    history: 0,
    privacy: 0,
  });
  const today = toLocalDate(new Date());
  const initialMonth = getMonthFromLocalDate(today);
  const {
    records,
    prediction,
    isLoading,
    isSaving,
    error: storageError,
    refresh,
    addRecord,
    removeRecord,
  } = useMenstrualCycles();

  const [visibleMonth, setVisibleMonth] =
    useState<VisibleMonth>(initialMonth);
  const [selectedDate, setSelectedDate] = useState(today);
  const [isSelecting, setIsSelecting] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState<string | null>(null);
  const [draftEndDate, setDraftEndDate] = useState<string | null>(null);
  const [selectionError, setSelectionError] = useState<string | null>(null);
  const [confirmUnusualDuration, setConfirmUnusualDuration] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [calendarOffsetY, setCalendarOffsetY] = useState(0);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialCardHeight, setTutorialCardHeight] = useState(280);
  const [tutorialLayoutRevision, setTutorialLayoutRevision] = useState(0);
  const [recordToDelete, setRecordToDelete] =
    useState<MenstrualCycleRecord | null>(null);
  const [notes, setNotes] = useState<CalendarNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [notesReady, setNotesReady] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();

  useNavigationState("/user/calendar");

  useEffect(() => {
    void loadCalendarNotes()
      .then(setNotes)
      .catch(() => setNotesError("Não foi possível carregar suas anotações."))
      .finally(() => setNotesReady(true));
  }, []);

  useEffect(() => {
    if (!notesReady) return;

    void saveCalendarNotes(notes).catch(() =>
      setNotesError("Não foi possível salvar suas anotações.")
    );
  }, [notes, notesReady]);

  const saveNote = () => {
    const text = noteText.trim();
    if (!text) return;

    setNotes((current) => [
      {
        id: `${Date.now()}`,
        date: selectedDate,
        note: text,
        symptoms: [],
        emoji: "📝",
      },
      ...current,
    ]);
    setNoteText("");
    setNotesError(null);
    setIsNoteModalVisible(false);
  };

  const monthGrid = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const selectedRecord = records.find((record) =>
    isDateInRange(selectedDate, record.startDate, record.endDate)
  );
  const selectedDateIsPredicted = Boolean(
    prediction &&
      isDateInRange(selectedDate, prediction.startDate, prediction.endDate)
  );
  const daysUntilPrediction = prediction
    ? daysBetween(today, prediction.startDate)
    : null;
  const predictionIsOngoing = Boolean(
    prediction &&
      isDateInRange(today, prediction.startDate, prediction.endDate)
  );
  const predictionIsOverdue = Boolean(
    prediction && compareLocalDates(today, prediction.endDate) > 0
  );
  const selectionInstruction = !draftStartDate
    ? "1. Toque no primeiro dia da menstruação."
    : !draftEndDate
      ? "2. Agora toque no último dia."
      : "Confira as datas antes de salvar.";
  const isSaveDisabled =
    !draftStartDate ||
    !draftEndDate ||
    isSaving ||
    isLoading ||
    Boolean(storageError);
  const historySummary = storageError
    ? "Não foi possível carregar os registros"
    : records.length === 0
      ? "Seus registros aparecerão aqui"
      : `${records.length} ${
          records.length === 1 ? "período" : "períodos"
        } registrado${records.length === 1 ? "" : "s"}`;
  const currentTutorialTarget = isTutorialActive
    ? CALENDAR_TUTORIAL_STEPS[tutorialStepIndex]?.target
    : null;

  useEffect(() => {
    if (!isTutorialActive) {
      return;
    }

    const animationFrame = requestAnimationFrame(() => {
      const target = CALENDAR_TUTORIAL_STEPS[tutorialStepIndex]?.target;

      if (!target) {
        return;
      }

      scrollViewRef.current?.scrollTo({
        y: Math.max(0, tutorialOffsetsRef.current[target] - 10),
        animated: !reduceMotion,
      });
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [
    isTutorialActive,
    reduceMotion,
    tutorialCardHeight,
    tutorialLayoutRevision,
    tutorialStepIndex,
  ]);

  useEffect(
    () => () => restoreTutorialFocusTaskRef.current?.cancel(),
    []
  );

  const handleTutorialTargetLayout = (
    target: CalendarTutorialTarget,
    event: LayoutChangeEvent
  ) => {
    const offsetY = event.nativeEvent.layout.y;
    const previousOffsetY = tutorialOffsetsRef.current[target];
    tutorialOffsetsRef.current[target] = offsetY;

    if (
      currentTutorialTarget === target &&
      Math.abs(previousOffsetY - offsetY) > 1
    ) {
      setTutorialLayoutRevision((currentRevision) => currentRevision + 1);
    }

    if (target === "calendar") {
      setCalendarOffsetY(offsetY);
    }
  };

  const isHighlightedForTutorial = (target: CalendarTutorialTarget) =>
    currentTutorialTarget === target;

  const changeMonth = (amount: number) => {
    setVisibleMonth((currentMonth) => {
      const nextMonth = new Date(
        currentMonth.year,
        currentMonth.monthIndex + amount,
        1
      );

      return {
        year: nextMonth.getFullYear(),
        monthIndex: nextMonth.getMonth(),
      };
    });
  };

  const goToToday = () => {
    setVisibleMonth(initialMonth);
    setSelectedDate(today);
  };

  const beginSelection = () => {
    if (isLoading || storageError) {
      return;
    }

    if (compareLocalDates(selectedDate, today) > 0) {
      setVisibleMonth(initialMonth);
      setSelectedDate(today);
    }

    setDraftStartDate(null);
    setDraftEndDate(null);
    setSelectionError(null);
    setConfirmUnusualDuration(false);
    setNotice(null);
    setIsSelecting(true);

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, calendarOffsetY - 10),
        animated: !reduceMotion,
      });
    });
  };

  const cancelSelection = () => {
    setIsSelecting(false);
    setDraftStartDate(null);
    setDraftEndDate(null);
    setSelectionError(null);
    setConfirmUnusualDuration(false);
  };

  const openTutorial = () => {
    restoreTutorialFocusTaskRef.current?.cancel();
    restoreTutorialFocusTaskRef.current = null;
    setNotice(null);
    setTutorialStepIndex(0);
    setIsTutorialActive(true);
  };

  const closeTutorial = () => {
    setIsTutorialActive(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    restoreTutorialFocusTaskRef.current?.cancel();

    restoreTutorialFocusTaskRef.current =
      InteractionManager.runAfterInteractions(() => {
        const node = findNodeHandle(tutorialButtonRef.current);

        if (node) {
          AccessibilityInfo.setAccessibilityFocus(node);
        }

        restoreTutorialFocusTaskRef.current = null;
      });
  };

  const showPreviousTutorialStep = () => {
    setTutorialStepIndex((currentStep) => Math.max(0, currentStep - 1));
  };

  const showNextTutorialStep = () => {
    const lastStepIndex = CALENDAR_TUTORIAL_STEPS.length - 1;

    if (tutorialStepIndex >= lastStepIndex) {
      closeTutorial();
      return;
    }

    setTutorialStepIndex((currentStep) =>
      Math.min(lastStepIndex, currentStep + 1)
    );
  };

  const handleDayPress = (date: string) => {
    setSelectedDate(date);

    if (!isSelecting) {
      return;
    }

    if (compareLocalDates(date, today) > 0) {
      setSelectionError("Escolha uma data de hoje ou anterior.");
      return;
    }

    setSelectionError(null);
    setConfirmUnusualDuration(false);

    if (!draftStartDate || draftEndDate) {
      setDraftStartDate(date);
      setDraftEndDate(null);
      return;
    }

    if (compareLocalDates(date, draftStartDate) < 0) {
      setDraftStartDate(date);
      setDraftEndDate(null);
      return;
    }

    setDraftEndDate(date);
  };

  const saveDraftRecord = async () => {
    if (!draftStartDate || !draftEndDate) {
      setSelectionError("Selecione o primeiro e o último dia da menstruação.");
      return;
    }

    const duration = daysBetween(draftStartDate, draftEndDate) + 1;

    if (duration > MAX_RECORDED_PERIOD_DAYS) {
      setSelectionError(
        `O período não pode ultrapassar ${MAX_RECORDED_PERIOD_DAYS} dias. Confira as datas selecionadas.`
      );
      return;
    }

    if (duration > 15 && !confirmUnusualDuration) {
      setConfirmUnusualDuration(true);
      setSelectionError(
        `O período selecionado tem ${duration} dias. Confira as datas e toque novamente em Salvar para confirmar.`
      );
      return;
    }

    const hasOverlap = records.some((record) =>
      rangesOverlap(
        draftStartDate,
        draftEndDate,
        record.startDate,
        record.endDate
      )
    );

    if (hasOverlap) {
      setSelectionError(
        "Esse período coincide com um registro existente. Exclua o registro anterior ou escolha outras datas."
      );
      return;
    }

    try {
      await addRecord(draftStartDate, draftEndDate);
      setSelectedDate(draftStartDate);
      setVisibleMonth(getMonthFromLocalDate(draftStartDate));
      setNotice("Período menstrual salvo somente neste aparelho.");
      cancelSelection();
    } catch (saveError) {
      setSelectionError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar. Tente novamente."
      );
    }
  };

  const confirmDelete = async () => {
    if (!recordToDelete) {
      return;
    }

    try {
      await removeRecord(recordToDelete.id);
      setNotice("Registro excluído do aparelho.");
      setDeleteError(null);
      setRecordToDelete(null);
    } catch {
      setDeleteError("Não foi possível excluir. Tente novamente.");
      setNotice(null);
    }
  };

  const getDayAccessibilityLabel = (
    date: string,
    registered: boolean,
    predicted: boolean,
    draft: boolean
  ) => {
    const labels = [formatLongDate(date)];

    if (date === today) labels.push("hoje");
    if (registered) labels.push("menstruação registrada");
    if (predicted && !registered) labels.push("menstruação prevista");
    if (draft) labels.push("selecionado para novo registro");
    if (isSelecting && compareLocalDates(date, today) > 0) {
      labels.push("indisponível para registro");
    }

    return labels.join(", ");
  };

  return (
    <LinearGradient
      colors={["#fff1f2", "#fdf2f8", "#faf5ff"]}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          isTutorialActive && {
            paddingBottom: Math.max(320, tutorialCardHeight + 48),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.header,
            isHighlightedForTutorial("intro") && styles.tutorialTarget,
          ]}
          onLayout={(event) => handleTutorialTargetLayout("intro", event)}
        >
          <View style={styles.titleRow}>
            <Text style={styles.title}>Meu calendário</Text>
            <TouchableOpacity
              ref={tutorialButtonRef}
              accessibilityLabel="Abrir tutorial do calendário"
              accessibilityHint="Abrir guia passo a passo do calendário menstrual"
              accessibilityRole="button"
              activeOpacity={0.78}
              style={styles.tutorialButton}
              onPress={openTutorial}
            >
              <Ionicons name="help-circle-outline" size={17} color="#6b21a8" />
              <Text style={styles.tutorialButtonText}>Tutorial</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Registre sua menstruação e acompanhe a previsão do próximo ciclo.
          </Text>
        </View>

        {storageError && (
          <View style={[styles.section, styles.messageSpacing]}>
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Ionicons name="alert-circle" size={20} color="#b91c1c" />
              <Text style={styles.errorBannerText}>{storageError}</Text>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.75}
                style={styles.retryStorageButton}
                onPress={() => void refresh()}
              >
                <Text style={styles.retryStorageButtonText}>Tentar de novo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {notice && (
          <View style={[styles.section, styles.messageSpacing]}>
            <View style={styles.successBanner} accessibilityRole="alert">
              <Ionicons name="checkmark-circle" size={20} color="#047857" />
              <Text style={styles.successBannerText}>{notice}</Text>
              <TouchableOpacity
                accessibilityLabel="Fechar mensagem"
                accessibilityRole="button"
                hitSlop={10}
                onPress={() => setNotice(null)}
              >
                <Ionicons name="close" size={20} color="#047857" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View
          style={[
            styles.section,
            isHighlightedForTutorial("prediction") && styles.tutorialTarget,
          ]}
          onLayout={(event) => handleTutorialTargetLayout("prediction", event)}
        >
          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#db2777" />
              <Text style={styles.loadingText}>Carregando seus registros...</Text>
            </View>
          ) : storageError ? (
            <View style={styles.emptyPredictionCard}>
              <View style={styles.unavailablePredictionIcon}>
                <Ionicons
                  name="cloud-offline-outline"
                  size={27}
                  color="#b91c1c"
                />
              </View>
              <View style={styles.emptyPredictionText}>
                <Text style={styles.emptyPredictionTitle}>
                  Previsão indisponível
                </Text>
                <Text style={styles.emptyPredictionSubtitle}>
                  Os dados locais não foram carregados. Tente novamente antes
                  de registrar um período.
                </Text>
              </View>
            </View>
          ) : prediction && daysUntilPrediction !== null ? (
            <LinearGradient
              colors={["#be123c", "#9d174d", "#6b21a8"]}
              style={styles.predictionCard}
            >
              <View style={styles.predictionTopRow}>
                <View style={styles.predictionIcon}>
                  <Ionicons name="calendar" size={24} color="#be185d" />
                </View>
                <View style={styles.predictionHeading}>
                  <Text style={styles.predictionEyebrow}>
                    {predictionIsOverdue
                      ? "PREVISÃO NÃO CONFIRMADA"
                      : "PRÓXIMO CICLO"}
                  </Text>
                  <Text style={styles.predictionDate}>
                    {formatLongDate(prediction.startDate)}
                  </Text>
                </View>
              </View>

              <Text style={styles.predictionCountdown}>
                {getCountdownLabel(daysUntilPrediction, predictionIsOngoing)}
              </Text>
              <Text style={styles.predictionDetails}>
                Duração prevista: {prediction.averagePeriodLength}{" "}
                {prediction.averagePeriodLength === 1 ? "dia" : "dias"} ·{" "}
                {prediction.basedOnCycles === 1
                  ? `estimativa inicial de ciclo: ${prediction.averageCycleLength} dias`
                  : `ciclo médio: ${prediction.averageCycleLength} dias`}
              </Text>
              <View style={styles.estimatePill}>
                <Ionicons name="sparkles" size={14} color="#ffffff" />
                <Text style={styles.estimatePillText}>
                  {predictionIsOverdue
                    ? "Registre um novo período para atualizar a previsão"
                    : prediction.basedOnCycles === 1
                      ? `Estimativa inicial: considera ${prediction.averageCycleLength} dias até haver 2 registros`
                      : `Estimativa baseada em ${prediction.basedOnCycles} períodos registrados`}
                </Text>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.emptyPredictionCard}>
              <View style={styles.emptyPredictionIcon}>
                <Ionicons name="calendar-outline" size={28} color="#db2777" />
              </View>
              <View style={styles.emptyPredictionText}>
                <Text style={styles.emptyPredictionTitle}>
                  Sua previsão começa aqui
                </Text>
                <Text style={styles.emptyPredictionSubtitle}>
                  Registre seu primeiro período para estimarmos o próximo ciclo.
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeadingRow}>
            <View>
              <Text style={styles.sectionTitle}>Minhas anotações</Text>
              <Text style={styles.sectionSubtitle}>
                Registre como você se sentiu em uma data.
              </Text>
            </View>
            <View style={styles.notesIcon}>
              <Ionicons name="create-outline" size={21} color="#be185d" />
            </View>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.86}
            style={styles.addNoteButton}
            onPress={() => {
              setNoteText("");
              setNotesError(null);
              setIsNoteModalVisible(true);
            }}
          >
            <Ionicons name="add-circle" size={23} color="#ffffff" />
            <Text style={styles.addNoteButtonText}>
              Anotar em {formatShortDate(selectedDate)}
            </Text>
          </TouchableOpacity>

          {notesError ? (
            <Text accessibilityRole="alert" style={styles.notesError}>
              {notesError}
            </Text>
          ) : null}

          {notes.map((item) => (
            <View key={item.id} style={styles.noteCard}>
              <View style={styles.noteEmojiBox}>
                <Text style={styles.noteEmoji}>{item.emoji || "📝"}</Text>
              </View>
              <View style={styles.noteContent}>
                <Text style={styles.noteDate}>
                  {/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(item.date)
                    ? formatLongDate(item.date)
                    : item.date}
                </Text>
                <Text style={styles.noteText}>{item.note}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Excluir anotação"
                accessibilityRole="button"
                activeOpacity={0.72}
                style={styles.noteDeleteButton}
                onPress={() =>
                  setNotes((current) =>
                    current.filter((note) => note.id !== item.id)
                  )
                }
              >
                <Ionicons name="trash-outline" size={18} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View
          style={styles.section}
          onLayout={(event) => handleTutorialTargetLayout("calendar", event)}
        >
          <View style={styles.calendarCard}>
            <View
              style={[
                styles.calendarHeader,
                isHighlightedForTutorial("calendar") && styles.tutorialTarget,
              ]}
            >
              <TouchableOpacity
                accessibilityLabel="Mês anterior"
                accessibilityRole="button"
                activeOpacity={0.75}
                style={styles.monthButton}
                onPress={() => changeMonth(-1)}
              >
                <Ionicons name="chevron-back" size={22} color="#374151" />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel="Voltar para o mês atual"
                accessibilityRole="button"
                activeOpacity={0.75}
                style={styles.monthHeadingButton}
                onPress={goToToday}
              >
                <Text style={styles.monthTitle}>
                  {formatMonthYear(
                    visibleMonth.year,
                    visibleMonth.monthIndex
                  )}
                </Text>
                <Text style={styles.todayShortcut}>Ir para hoje</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel="Próximo mês"
                accessibilityRole="button"
                activeOpacity={0.75}
                style={styles.monthButton}
                onPress={() => changeMonth(1)}
              >
                <Ionicons name="chevron-forward" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            {isSelecting && (
              <View
                accessibilityLiveRegion="polite"
                style={styles.selectionBanner}
              >
                <View style={styles.selectionBannerIcon}>
                  <Ionicons name="finger-print" size={19} color="#7e22ce" />
                </View>
                <View style={styles.selectionBannerCopy}>
                  <Text style={styles.selectionBannerTitle}>
                    Registrando período concluído
                  </Text>
                  <Text style={styles.selectionBannerText}>
                    {selectionInstruction}
                  </Text>
                </View>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>
                    {draftEndDate ? "2/2" : draftStartDate ? "1/2" : "0/2"}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.weekDays} accessibilityRole="header">
              {WEEK_DAYS.map((day) => (
                <Text key={day} style={styles.weekDay}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {monthGrid.map((date, index) => {
                if (!date) {
                  return <View key={`empty-${index}`} style={styles.dayCell} />;
                }

                const dayNumber = Number(date.slice(-2));
                const registered = records.some((record) =>
                  isDateInRange(date, record.startDate, record.endDate)
                );
                const predicted = Boolean(
                  prediction &&
                    isDateInRange(date, prediction.startDate, prediction.endDate)
                );
                const draft = Boolean(
                  draftStartDate &&
                    isDateInRange(
                      date,
                      draftStartDate,
                      draftEndDate ?? draftStartDate
                    )
                );
                const isToday = date === today;
                const isSelected = date === selectedDate;
                const isFuture = compareLocalDates(date, today) > 0;
                const hasStrongBackground = registered || draft;

                return (
                  <View key={date} style={styles.dayCell}>
                    <TouchableOpacity
                      accessibilityLabel={getDayAccessibilityLabel(
                        date,
                        registered,
                        predicted,
                        draft
                      )}
                  accessibilityRole="button"
                      accessibilityState={{
                        selected: isSelected || draft,
                        disabled: isSelecting && isFuture,
                      }}
                      activeOpacity={0.72}
                      disabled={isSelecting && isFuture}
                      style={[
                        styles.dayButton,
                        predicted && !registered && styles.dayPredicted,
                        registered && styles.dayRegistered,
                        draft && styles.dayDraft,
                        isToday && styles.dayToday,
                        isSelected && styles.daySelected,
                        isFuture && isSelecting && styles.dayUnavailable,
                      ]}
                      onPress={() => handleDayPress(date)}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          hasStrongBackground && styles.dayTextStrong,
                          isFuture && isSelecting && styles.dayTextUnavailable,
                        ]}
                      >
                        {dayNumber}
                      </Text>
                      {isToday && (
                        <View
                          style={[
                            styles.todayDot,
                            hasStrongBackground && styles.todayDotStrong,
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendRegistered]} />
                <Text style={styles.legendText}>Registrado</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, styles.legendPredicted]} />
                <Text style={styles.legendText}>Previsão</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendToday} />
                <Text style={styles.legendText}>Hoje</Text>
              </View>
            </View>

            {!isSelecting && (
              <View style={styles.selectedDateCard}>
                <View style={styles.selectedDateIcon}>
                  <Ionicons
                    name={
                      selectedRecord
                        ? "water"
                        : selectedDateIsPredicted
                          ? "sparkles"
                          : "calendar-outline"
                    }
                    size={18}
                    color="#be185d"
                  />
                </View>
                <View style={styles.selectedDateTextWrapper}>
                  <Text style={styles.selectedDateTitle}>
                    {formatLongDate(selectedDate)}
                  </Text>
                  <Text style={styles.selectedDateDescription}>
                    {selectedRecord
                      ? `Menstruação registrada · ${
                          daysBetween(
                            selectedRecord.startDate,
                            selectedRecord.endDate
                          ) + 1
                        } dias`
                      : selectedDateIsPredicted
                        ? "Data incluída na previsão do próximo ciclo"
                        : "Nenhum período menstrual registrado nesta data"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View
          style={[
            styles.section,
            isHighlightedForTutorial("registration") && styles.tutorialTarget,
          ]}
          onLayout={(event) =>
            handleTutorialTargetLayout("registration", event)
          }
        >
          {isSelecting ? (
            <View style={styles.selectionCard}>
              <View style={styles.selectionHeader}>
                <View style={styles.selectionHeaderText}>
                  <Text style={styles.selectionTitle}>Novo registro</Text>
                  <Text style={styles.selectionInstruction}>
                    Selecione o início e o término no calendário acima.
                  </Text>
                </View>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>
                    {draftEndDate ? "2/2" : draftStartDate ? "1/2" : "0/2"}
                  </Text>
                </View>
              </View>

              <View style={styles.dateFieldsRow}>
                <View style={styles.dateField}>
                  <Text style={styles.dateFieldLabel}>INÍCIO</Text>
                  <Text style={styles.dateFieldValue}>
                    {draftStartDate ? formatShortDate(draftStartDate) : "--/--/----"}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#9ca3af" />
                <View style={styles.dateField}>
                  <Text style={styles.dateFieldLabel}>TÉRMINO</Text>
                  <Text style={styles.dateFieldValue}>
                    {draftEndDate ? formatShortDate(draftEndDate) : "--/--/----"}
                  </Text>
                </View>
              </View>

              {selectionError && (
                <View style={styles.selectionError} accessibilityRole="alert">
                  <Ionicons name="alert-circle-outline" size={18} color="#b91c1c" />
                  <Text style={styles.selectionErrorText}>{selectionError}</Text>
                </View>
              )}

              <View style={styles.selectionActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.75}
                  style={styles.cancelButton}
                  onPress={cancelSelection}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{
                    disabled: isSaveDisabled,
                  }}
                  activeOpacity={0.82}
                  disabled={isSaveDisabled}
                  style={[
                    styles.saveButton,
                    isSaveDisabled && styles.saveButtonDisabled,
                  ]}
                  onPress={() => void saveDraftRecord()}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={19} color="#ffffff" />
                      <Text style={styles.saveButtonText}>Salvar registro</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{
                disabled: isLoading || Boolean(storageError),
              }}
              activeOpacity={0.88}
              disabled={isLoading || Boolean(storageError)}
              style={[
                styles.addButton,
                (isLoading || Boolean(storageError)) && styles.addButtonDisabled,
              ]}
              onPress={beginSelection}
            >
              <LinearGradient
                colors={["#e11d48", "#be185d"]}
                style={styles.addGradient}
              >
                <Ionicons name="add-circle" size={25} color="#ffffff" />
                <Text style={styles.addButtonText}>
                  Registrar período concluído
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        <View
          style={styles.section}
          onLayout={(event) => handleTutorialTargetLayout("history", event)}
        >
          <View
            style={[
              styles.sectionHeadingRow,
              isHighlightedForTutorial("history") && styles.tutorialTarget,
            ]}
          >
            <View>
              <Text style={styles.sectionTitle}>Histórico menstrual</Text>
              <Text style={styles.sectionSubtitle}>
                {historySummary}
              </Text>
            </View>
            <View style={styles.historyIcon}>
              <Ionicons name="time-outline" size={21} color="#be185d" />
            </View>
          </View>

          {storageError && !isLoading ? (
            <View style={styles.emptyHistoryCard}>
              <View style={styles.historyUnavailableIcon}>
                <Ionicons
                  name="alert-circle-outline"
                  size={25}
                  color="#b91c1c"
                />
              </View>
              <Text style={styles.emptyHistoryTitle}>Histórico indisponível</Text>
              <Text style={styles.emptyHistoryText}>
                Seus registros não foram apagados. Tente carregar novamente
                pelo aviso acima.
              </Text>
            </View>
          ) : records.length === 0 && !isLoading ? (
            <View style={styles.emptyHistoryCard}>
              <Text style={styles.emptyHistoryEmoji}>🌷</Text>
              <Text style={styles.emptyHistoryTitle}>Nenhum período registrado</Text>
              <Text style={styles.emptyHistoryText}>
                Use o botão acima e selecione as datas no calendário.
              </Text>
            </View>
          ) : (
            records.map((record) => {
              const duration = daysBetween(record.startDate, record.endDate) + 1;

              return (
                <View key={record.id} style={styles.historyCard}>
                  <View style={styles.historyCardIcon}>
                    <Ionicons name="water" size={21} color="#e11d48" />
                  </View>
                  <View style={styles.historyCardContent}>
                    <Text style={styles.historyCardTitle}>
                      {formatLongDate(record.startDate)}
                    </Text>
                    <Text style={styles.historyCardRange}>
                      {formatShortDate(record.startDate)} a{" "}
                      {formatShortDate(record.endDate)}
                    </Text>
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationBadgeText}>
                        {duration} {duration === 1 ? "dia" : "dias"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    accessibilityLabel={`Excluir período iniciado em ${formatLongDate(
                      record.startDate
                    )}`}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: isLoading || Boolean(storageError) || isSaving,
                    }}
                    activeOpacity={0.72}
                    disabled={isLoading || Boolean(storageError) || isSaving}
                    style={styles.deleteButton}
                    onPress={() => {
                      setDeleteError(null);
                      setRecordToDelete(record);
                    }}
                  >
                    <Ionicons name="trash-outline" size={19} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <View
          style={[
            styles.section,
            isHighlightedForTutorial("privacy") && styles.tutorialTarget,
          ]}
          onLayout={(event) => handleTutorialTargetLayout("privacy", event)}
        >
          <View style={styles.localDataCard}>
            <View style={styles.localDataIcon}>
              <Ionicons name="phone-portrait-outline" size={20} color="#7e22ce" />
            </View>
            <View style={styles.localDataContent}>
              <Text style={styles.localDataTitle}>Dados armazenados localmente</Text>
              <Text style={styles.localDataText}>
                Seus registros e anotações ficam protegidos neste aparelho e podem ser
                apagados no Perfil. A previsão é uma estimativa e não substitui
                orientação profissional.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <CalendarTutorial
        visible={isTutorialActive}
        stepIndex={tutorialStepIndex}
        isRegistering={isSelecting}
        onPrevious={showPreviousTutorialStep}
        onNext={showNextTutorialStep}
        onClose={closeTutorial}
        reduceMotion={reduceMotion}
        onCardHeightChange={(height) =>
          setTutorialCardHeight((currentHeight) =>
            Math.abs(currentHeight - height) > 1 ? height : currentHeight
          )
        }
      />

      <Modal
        visible={isNoteModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsNoteModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <Pressable
            accessibilityLabel="Fechar nova anotação"
            style={styles.modalOverlay}
            onPress={() => setIsNoteModalVisible(false)}
          />
          <View style={styles.noteModal} accessibilityViewIsModal>
            <View style={styles.noteModalHeader}>
              <View>
                <Text style={styles.noteModalTitle}>Nova anotação</Text>
                <Text style={styles.noteModalDate}>
                  {formatLongDate(selectedDate)}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityLabel="Fechar"
                onPress={() => setIsNoteModalVisible(false)}
              >
                <Ionicons name="close" size={25} color="#4b5563" />
              </TouchableOpacity>
            </View>
            <TextInput
              autoFocus
              maxLength={600}
              multiline
              placeholder="Escreva como foi seu dia..."
              placeholderTextColor="#9ca3af"
              style={styles.noteInput}
              textAlignVertical="top"
              value={noteText}
              onChangeText={setNoteText}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={{ disabled: !noteText.trim() }}
              activeOpacity={0.82}
              disabled={!noteText.trim()}
              style={[
                styles.noteSaveButton,
                !noteText.trim() && styles.saveButtonDisabled,
              ]}
              onPress={saveNote}
            >
              <Text style={styles.noteSaveButtonText}>Salvar anotação</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={Boolean(recordToDelete)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setDeleteError(null);
          setRecordToDelete(null);
        }}
      >
        <View style={styles.modalContainer}>
          <Pressable
            accessibilityLabel="Fechar confirmação"
            style={styles.modalOverlay}
            onPress={() => {
              setDeleteError(null);
              setRecordToDelete(null);
            }}
          />
          <View
            accessibilityViewIsModal
            onAccessibilityEscape={() => {
              setDeleteError(null);
              setRecordToDelete(null);
            }}
            style={styles.deleteModal}
          >
            <View style={styles.deleteModalIcon}>
              <Ionicons name="trash" size={28} color="#dc2626" />
            </View>
            <Text style={styles.deleteModalTitle}>Excluir este período?</Text>
            <Text style={styles.deleteModalText}>
              {recordToDelete
                ? `O período de ${formatShortDate(
                    recordToDelete.startDate
                  )} a ${formatShortDate(recordToDelete.endDate)} será removido deste aparelho.`
                : ""}
            </Text>
            {deleteError && (
              <View style={styles.deleteModalError} accessibilityRole="alert">
                <Ionicons name="alert-circle" size={18} color="#b91c1c" />
                <Text style={styles.deleteModalErrorText}>{deleteError}</Text>
              </View>
            )}
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.75}
                style={styles.deleteModalCancel}
                onPress={() => {
                  setDeleteError(null);
                  setRecordToDelete(null);
                }}
              >
                <Text style={styles.deleteModalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ disabled: isSaving }}
                activeOpacity={0.8}
                disabled={isSaving}
                style={styles.deleteModalConfirm}
                onPress={() => void confirmDelete()}
              >
                {isSaving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.deleteModalConfirmText}>Excluir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignSelf: "center",
    maxWidth: 760,
    paddingTop: 52,
    paddingBottom: 36,
    width: "100%",
  },
  header: {
    paddingHorizontal: 22,
    marginBottom: 22,
  },
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 9,
    marginBottom: 7,
  },
  title: {
    color: "#111827",
    flex: 1,
    flexShrink: 1,
    fontSize: 29,
    fontWeight: "800",
    lineHeight: 35,
  },
  tutorialButton: {
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    borderColor: "#e9d5ff",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    flexShrink: 0,
    gap: 5,
    minHeight: 44,
    paddingHorizontal: 11,
  },
  tutorialButtonText: {
    color: "#6b21a8",
    fontSize: 12,
    fontWeight: "800",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 440,
  },
  section: {
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  tutorialTarget: {
    backgroundColor: "rgba(255,255,255,0.42)",
    borderColor: "#7e22ce",
    borderRadius: 34,
    borderWidth: 3,
    elevation: 14,
    shadowColor: "#7e22ce",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  messageSpacing: {
    marginBottom: 12,
  },
  errorBanner: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  errorBannerText: {
    color: "#991b1b",
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  retryStorageButton: {
    backgroundColor: "#fee2e2",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  retryStorageButtonText: {
    color: "#991b1b",
    fontSize: 11,
    fontWeight: "800",
  },
  successBanner: {
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    padding: 14,
  },
  successBannerText: {
    color: "#065f46",
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    minHeight: 112,
    padding: 22,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
  },
  predictionCard: {
    borderRadius: 30,
    elevation: 8,
    padding: 22,
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  predictionTopRow: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 16,
  },
  predictionIcon: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    marginRight: 14,
    width: 52,
  },
  predictionHeading: {
    flex: 1,
  },
  predictionEyebrow: {
    color: "#fce7f3",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  predictionDate: {
    color: "#ffffff",
    fontSize: 25,
    fontWeight: "800",
  },
  predictionCountdown: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 7,
  },
  predictionDetails: {
    color: "#fdf2f8",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 15,
  },
  estimatePill: {
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 999,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  estimatePillText: {
    color: "#ffffff",
    flex: 1,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "700",
  },
  emptyPredictionCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#fbcfe8",
    borderRadius: 28,
    borderWidth: 1,
    elevation: 4,
    flexDirection: "row",
    padding: 20,
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
  },
  emptyPredictionIcon: {
    alignItems: "center",
    backgroundColor: "#fdf2f8",
    borderRadius: 20,
    height: 58,
    justifyContent: "center",
    marginRight: 15,
    width: 58,
  },
  unavailablePredictionIcon: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 20,
    height: 58,
    justifyContent: "center",
    marginRight: 15,
    width: 58,
  },
  emptyPredictionText: {
    flex: 1,
  },
  emptyPredictionTitle: {
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 5,
  },
  emptyPredictionSubtitle: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
  },
  calendarCard: {
    backgroundColor: "#ffffff",
    borderRadius: 30,
    elevation: 6,
    paddingHorizontal: 8,
    paddingVertical: 20,
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  monthButton: {
    alignItems: "center",
    backgroundColor: "#fdf2f8",
    borderRadius: 15,
    height: 46,
    justifyContent: "center",
    width: 46,
  },
  monthHeadingButton: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 6,
    minHeight: 46,
    justifyContent: "center",
  },
  monthTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  todayShortcut: {
    color: "#db2777",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  selectionBanner: {
    alignItems: "center",
    backgroundColor: "#faf5ff",
    borderColor: "#e9d5ff",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 16,
    padding: 11,
  },
  selectionBannerIcon: {
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    marginRight: 9,
    width: 38,
  },
  selectionBannerCopy: {
    flex: 1,
    paddingRight: 6,
  },
  selectionBannerTitle: {
    color: "#581c87",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 2,
  },
  selectionBannerText: {
    color: "#7e22ce",
    fontSize: 11,
    lineHeight: 15,
  },
  weekDays: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    color: "#9ca3af",
    flex: 1,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  dayCell: {
    aspectRatio: 1,
    padding: 1,
    width: "14.2857%",
  },
  dayButton: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 15,
    borderWidth: 2,
    flex: 1,
    justifyContent: "center",
  },
  dayPredicted: {
    backgroundColor: "#fce7f3",
    borderColor: "#f9a8d4",
    borderStyle: "dashed",
  },
  dayRegistered: {
    backgroundColor: "#e11d48",
    borderColor: "#e11d48",
    borderStyle: "solid",
  },
  dayDraft: {
    backgroundColor: "#7e22ce",
    borderColor: "#7e22ce",
    borderStyle: "solid",
  },
  dayToday: {
    borderColor: "#db2777",
    borderStyle: "solid",
  },
  daySelected: {
    borderColor: "#111827",
    borderStyle: "solid",
  },
  dayUnavailable: {
    backgroundColor: "#f9fafb",
    borderColor: "transparent",
  },
  dayText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
  },
  dayTextStrong: {
    color: "#ffffff",
  },
  dayTextUnavailable: {
    color: "#d1d5db",
  },
  todayDot: {
    backgroundColor: "#db2777",
    borderRadius: 2,
    bottom: 4,
    height: 4,
    position: "absolute",
    width: 4,
  },
  todayDotStrong: {
    backgroundColor: "#ffffff",
  },
  legend: {
    alignItems: "center",
    borderTopColor: "#f3f4f6",
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingHorizontal: 3,
    paddingTop: 15,
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
  },
  legendDot: {
    borderRadius: 5,
    height: 11,
    marginRight: 6,
    width: 11,
  },
  legendRegistered: {
    backgroundColor: "#e11d48",
  },
  legendPredicted: {
    backgroundColor: "#fce7f3",
    borderColor: "#f472b6",
    borderWidth: 1,
  },
  legendToday: {
    backgroundColor: "#db2777",
    borderRadius: 3,
    height: 6,
    marginHorizontal: 3,
    marginRight: 9,
    width: 6,
  },
  legendText: {
    color: "#6b7280",
    fontSize: 11,
  },
  selectedDateCard: {
    alignItems: "center",
    backgroundColor: "#fff7fb",
    borderRadius: 18,
    flexDirection: "row",
    marginTop: 15,
    padding: 12,
  },
  selectedDateIcon: {
    alignItems: "center",
    backgroundColor: "#fce7f3",
    borderRadius: 13,
    height: 40,
    justifyContent: "center",
    marginRight: 11,
    width: 40,
  },
  selectedDateTextWrapper: {
    flex: 1,
  },
  selectedDateTitle: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 3,
  },
  selectedDateDescription: {
    color: "#6b7280",
    fontSize: 11,
    lineHeight: 16,
  },
  addButton: {
    borderRadius: 22,
    elevation: 5,
    overflow: "hidden",
    shadowColor: "#db2777",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
  },
  addButtonDisabled: {
    opacity: 0.55,
  },
  addGradient: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 62,
    paddingHorizontal: 18,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800",
  },
  selectionCard: {
    backgroundColor: "#ffffff",
    borderColor: "#e9d5ff",
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
  },
  selectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  selectionHeaderText: {
    flex: 1,
    paddingRight: 10,
  },
  selectionTitle: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "800",
    marginBottom: 4,
  },
  selectionInstruction: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 18,
  },
  stepBadge: {
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  stepBadgeText: {
    color: "#7e22ce",
    fontSize: 12,
    fontWeight: "800",
  },
  dateFieldsRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },
  dateField: {
    backgroundColor: "#faf5ff",
    borderRadius: 16,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateFieldLabel: {
    color: "#9333ea",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  dateFieldValue: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "800",
  },
  selectionError: {
    alignItems: "flex-start",
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    padding: 11,
  },
  selectionErrorText: {
    color: "#991b1b",
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  selectionActions: {
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    minHeight: 50,
  },
  cancelButtonText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "800",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#7e22ce",
    borderRadius: 16,
    flex: 1.45,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 50,
  },
  saveButtonDisabled: {
    backgroundColor: "#d1d5db",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  sectionHeadingRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 3,
  },
  sectionTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
  },
  sectionSubtitle: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 3,
  },
  historyIcon: {
    alignItems: "center",
    backgroundColor: "#fce7f3",
    borderRadius: 15,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  emptyHistoryCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#f3e8ff",
    borderRadius: 26,
    borderWidth: 1,
    padding: 25,
  },
  emptyHistoryEmoji: {
    fontSize: 34,
    marginBottom: 9,
  },
  historyUnavailableIcon: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 18,
    height: 52,
    justifyContent: "center",
    marginBottom: 10,
    width: 52,
  },
  emptyHistoryTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 5,
  },
  emptyHistoryText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  historyCard: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    elevation: 4,
    flexDirection: "row",
    marginBottom: 12,
    padding: 15,
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  historyCardIcon: {
    alignItems: "center",
    backgroundColor: "#fff1f2",
    borderRadius: 17,
    height: 50,
    justifyContent: "center",
    marginRight: 12,
    width: 50,
  },
  historyCardContent: {
    flex: 1,
  },
  historyCardTitle: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },
  historyCardRange: {
    color: "#6b7280",
    fontSize: 11,
    marginBottom: 7,
  },
  durationBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fce7f3",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  durationBadgeText: {
    color: "#be185d",
    fontSize: 10,
    fontWeight: "800",
  },
  deleteButton: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 15,
    height: 44,
    justifyContent: "center",
    marginLeft: 8,
    width: 44,
  },
  localDataCard: {
    alignItems: "flex-start",
    backgroundColor: "#faf5ff",
    borderColor: "#e9d5ff",
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    padding: 16,
  },
  localDataIcon: {
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    borderRadius: 14,
    height: 42,
    justifyContent: "center",
    marginRight: 12,
    width: 42,
  },
  localDataContent: {
    flex: 1,
  },
  localDataTitle: {
    color: "#581c87",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  localDataText: {
    color: "#6b21a8",
    fontSize: 11,
    lineHeight: 17,
  },
  notesIcon: {
    alignItems: "center",
    backgroundColor: "#fce7f3",
    borderRadius: 16,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  addNoteButton: {
    alignItems: "center",
    backgroundColor: "#be185d",
    borderRadius: 17,
    flexDirection: "row",
    gap: 9,
    justifyContent: "center",
    marginTop: 16,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  addNoteButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
  notesError: {
    color: "#b91c1c",
    fontSize: 12,
    marginTop: 10,
  },
  noteCard: {
    alignItems: "flex-start",
    backgroundColor: "#ffffff",
    borderColor: "#fbcfe8",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    padding: 14,
  },
  noteEmojiBox: {
    alignItems: "center",
    backgroundColor: "#fdf2f8",
    borderRadius: 13,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  noteEmoji: { fontSize: 21 },
  noteContent: { flex: 1, minWidth: 0 },
  noteDate: {
    color: "#be185d",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5,
  },
  noteText: { color: "#374151", fontSize: 14, lineHeight: 20 },
  noteDeleteButton: {
    alignItems: "center",
    borderRadius: 11,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  noteModal: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    elevation: 10,
    maxWidth: 520,
    padding: 22,
    width: "100%",
  },
  noteModalHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  noteModalTitle: { color: "#111827", fontSize: 20, fontWeight: "800" },
  noteModalDate: { color: "#6b7280", fontSize: 12, marginTop: 4 },
  noteInput: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
    borderRadius: 15,
    borderWidth: 1,
    color: "#111827",
    fontSize: 14,
    minHeight: 130,
    padding: 14,
  },
  noteSaveButton: {
    alignItems: "center",
    backgroundColor: "#be185d",
    borderRadius: 15,
    justifyContent: "center",
    marginTop: 14,
    minHeight: 50,
  },
  noteSaveButtonText: { color: "#ffffff", fontSize: 14, fontWeight: "800" },
  modalContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 22,
  },
  modalOverlay: {
    backgroundColor: "rgba(17,24,39,0.48)",
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  deleteModal: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 28,
    elevation: 10,
    maxWidth: 420,
    padding: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    width: "100%",
  },
  deleteModalIcon: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 22,
    height: 62,
    justifyContent: "center",
    marginBottom: 15,
    width: 62,
  },
  deleteModalTitle: {
    color: "#111827",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  deleteModalText: {
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 21,
    textAlign: "center",
  },
  deleteModalError: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
    padding: 11,
    width: "100%",
  },
  deleteModalErrorText: {
    color: "#991b1b",
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  deleteModalActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  deleteModalCancel: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    minHeight: 50,
  },
  deleteModalCancelText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "800",
  },
  deleteModalConfirm: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    minHeight: 50,
  },
  deleteModalConfirmText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});
