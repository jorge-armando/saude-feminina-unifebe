import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useIsFocused } from "@react-navigation/native";
import { useNavigationState } from "../../hooks/useNavigationState";
import { useMenstrualCycles } from "../../hooks/useMenstrualCycles";
import { useCycleTracking } from "../../services/useCycleTracking";
import {
  calculateCurrentCycleDay,
  compareLocalDates,
  daysBetween,
  formatShortDate,
  toLocalDate,
} from "../../services/menstrualCycle";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { dailyMessages } from "../../data/dailyMessages";
import { useContents } from "../../hooks/useContents";
import { loadLocalUserProfile } from "../../services/userProfile";
import { getTodayDailyMessage } from "../../services/dailyMessage";
import { useReminders } from "../../hooks/useReminders";
import {
  reminderToDate,
  sortRemindersChronologically,
} from "../../services/reminders";
import { useAppNotificationState } from "../../hooks/useAppNotificationState";
import { buildAppNotifications } from "../../services/appNotifications";
import { ContentImage } from "../../components/content/ContentImage";
import { getContentImageUrl } from "../../services/contentMedia";

const dailyIcons = ["💝", "🌸", "✨", "🌙", "💕", "🦋", "🌺", "💫"];

const dailyColors = [
  ["#b45309", "#be123c", "#6b21a8"],
  ["#be185d", "#c2410c", "#6d28d9"],
  ["#0e7490", "#1d4ed8", "#6d28d9"],
  ["#047857", "#b45309", "#b91c1c"],
  ["#7e22ce", "#be185d", "#0e7490"],
  ["#c2410c", "#047857", "#1d4ed8"],
];

const contentPalettes = [
  { emoji: "🌙", colors: ["#fb7185", "#fda4af"] },
  { emoji: "🥗", colors: ["#34d399", "#2dd4bf"] },
  { emoji: "🧘‍♀️", colors: ["#fbbf24", "#fb923c"] },
] as const;

const { width } = Dimensions.get("window");

export default function HomePage() {
  const [userName, setUserName] = useState("Usuária");
  const [dailyMessage, setDailyMessage] = useState(dailyMessages[0]);
  const [dailyIcon, setDailyIcon] = useState(dailyIcons[0]);
  const [dailyColorScheme, setDailyColorScheme] = useState(dailyColors[0]);
  const [dailyMessageError, setDailyMessageError] = useState<string | null>(null);
  const [isRefreshingDailyMessage, setIsRefreshingDailyMessage] = useState(false);
  const {
    records: cycleRecords,
    isLoading: isCycleLoading,
    error: cycleError,
  } = useMenstrualCycles();
  const { prediction: cyclePrediction } = useCycleTracking(cycleRecords);
  const {
    reminders: reminderRecords,
    preferences,
    isLoading: isRemindersLoading,
    error: remindersError,
    refresh: refreshReminders,
  } = useReminders();
  const { state: notificationState, error: notificationStateError } =
    useAppNotificationState();
  const {
    data: contentsData,
    isLoading: isContentsLoading,
    error: contentsError,
    refetch: refetchContents,
  } = useContents();

  const isFocused = useIsFocused();

  useNavigationState("/user/home");

  useEffect(() => {
    async function loadUser() {
      try {
        const profile = await loadLocalUserProfile();
        if (profile) {
          setUserName(profile.name);
        }
      } catch {
        // A guarda de rotas já trata perfis ausentes; mantenha um texto neutro aqui.
      }
    }

    if (isFocused) {
      void loadUser();
    }
  }, [isFocused]);

  useEffect(() => {
    async function loadDailyMessage() {
      try {
        const record = await getTodayDailyMessage();
        setDailyMessage(record.message);
        setDailyIcon(record.icon);
        setDailyColorScheme(record.colors);
        setDailyMessageError(null);
      } catch {
        setDailyMessageError(
          "A mensagem não pôde ser atualizada, mas você pode continuar usando o app.",
        );
      }
    }

    void loadDailyMessage();
  }, []);

  const refreshDailyMessage = async () => {
    if (isRefreshingDailyMessage) return;

    setIsRefreshingDailyMessage(true);
    setDailyMessageError(null);

    try {
      const record = await getTodayDailyMessage({ forceRefresh: true });
      setDailyMessage(record.message);
      setDailyIcon(record.icon);
      setDailyColorScheme(record.colors);
    } catch {
      setDailyMessageError("Não foi possível trocar a mensagem agora.");
    } finally {
      setIsRefreshingDailyMessage(false);
    }
  };

  const quickActions = [
    {
      title: "Meu Ciclo",
      emoji: "🌸",
      colors: ["#fb7185", "#ec4899"],
      link: "/user/calendar" as const,
    },
    {
      title: "Conteúdos",
      emoji: "📚",
      colors: ["#a78bfa", "#8b5cf6"],
      link: "/user/content" as const,
    },
  ] as const;

  const contents = useMemo(
    () =>
      (contentsData?.data ?? []).slice(0, 3).map((content, index) => ({
        id: String(content.id),
        title: content.title,
        category: content.tags.split(",")[0]?.trim() || "Saúde",
        time: `${content.reading_time} min`,
        imageUrl: getContentImageUrl(content),
        ...contentPalettes[index % contentPalettes.length],
      })),
    [contentsData],
  );

  const reminders = useMemo(() => {
    const now = Date.now();
    const repeatLabels = {
      daily: "Diariamente",
      weekly: "Semanalmente",
      monthly: "Mensalmente",
      yearly: "Anualmente",
    } as const;

    return sortRemindersChronologically(reminderRecords)
      .filter(
        (reminder) =>
          reminder.repeat !== "none" || reminderToDate(reminder).getTime() > now,
      )
      .slice(0, 3)
      .map((reminder) => ({
        id: reminder.id,
        type: "Lembrete",
        title: reminder.title,
        emoji: reminder.emoji,
        date:
          reminder.repeat === "none"
            ? reminderToDate(reminder).toLocaleString("pt-BR", {
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })
            : `${repeatLabels[reminder.repeat]} às ${reminder.hour}:${reminder.minute}`,
      }));
  }, [reminderRecords]);

  const unreadNotificationCount = useMemo(() => {
    if (notificationStateError) return 0;

    const readIds = new Set(notificationState.readIds);
    const dismissedIds = new Set(notificationState.dismissedIds);
    return buildAppNotifications({
      reminders: reminderRecords,
      prediction: cyclePrediction,
      contents: contentsData?.data ?? [],
      preferences,
    }).filter(
      (item) => !dismissedIds.has(item.id) && !readIds.has(item.id),
    ).length;
  }, [
    contentsData,
    cyclePrediction,
    notificationState,
    notificationStateError,
    preferences,
    reminderRecords,
  ]);

  const handleQuickAction = (route: string | null) => {
    if (!route) {
      return;
    }

    router.push(route as any);
  };

  const handleOpenContentDetail = (id: string) => {
    router.push({
      pathname: "/user/content-detail",
      params: { id },
    });
  };

  const today = toLocalDate(new Date());
  const activeCyclePrediction = cyclePrediction?.predictionAvailable
    ? cyclePrediction
    : null;
  const cycleLength = cyclePrediction?.averageCycleLength ?? 28;
  const currentCycleDay = cyclePrediction
    ? calculateCurrentCycleDay(cycleRecords, cycleLength, today)
    : null;
  const cycleProgress = currentCycleDay
    ? Math.min(100, (currentCycleDay / cycleLength) * 100)
    : 0;
  const daysUntilNextCycle = activeCyclePrediction
    ? daysBetween(today, activeCyclePrediction.startDate)
    : null;
  const hasCycleData = Boolean(
    !cycleError && cyclePrediction && currentCycleDay
  );
  const predictionIsOverdue = Boolean(
    activeCyclePrediction &&
      compareLocalDates(today, activeCyclePrediction.endDate) > 0
  );
  const hasCurrentCycleEstimate = hasCycleData && !predictionIsOverdue;
  const predictionIsPaused = Boolean(
    cyclePrediction && !cyclePrediction.predictionAvailable
  );
  const cycleInfo = predictionIsOverdue && !cycleError
    ? {
        phase: "Atualize seu calendário",
        icon: "🗓️",
        message:
          "A última previsão não foi confirmada. Registre um novo período para recalcular.",
        colors: ["#be123c", "#9d174d", "#6b21a8"],
      }
    : hasCycleData
    ? {
        phase: "Ciclo acompanhado",
        icon: "🌸",
        message: `Dia ${currentCycleDay} de um ciclo ${
          cyclePrediction?.basedOnCycles === 1 ? "estimado" : "médio"
        } de ${cycleLength} dias`,
        colors: ["#be123c", "#9d174d", "#6b21a8"],
      }
    : {
        phase: cycleError
          ? "Calendário indisponível"
          : isCycleLoading
            ? "Carregando calendário"
            : "Comece seu calendário",
        icon: cycleError ? "⚠️" : "🗓️",
        message: cycleError
          ? "Não foi possível carregar os registros locais. Abra o calendário para tentar novamente."
          : isCycleLoading
            ? "Buscando seus registros neste aparelho..."
            : "Registre um período concluído para acompanhar o próximo ciclo.",
        colors: ["#be123c", "#9d174d", "#6b21a8"],
      };
  const nextPeriodLabel = cycleError
    ? "Verificar calendário"
    : isCycleLoading
      ? "Carregando registros"
      : predictionIsOverdue
        ? "Previsão não confirmada"
        : predictionIsPaused
          ? "Previsão pausada"
          : hasCycleData
            ? "Próxima previsão"
            : "Registrar primeiro período";
  const nextPeriodValue = cycleError
    ? "Verificar"
    : isCycleLoading
      ? "..."
      : predictionIsOverdue
        ? "Atualizar"
        : predictionIsPaused
          ? "Ver detalhes"
          : daysUntilNextCycle === null
            ? "Começar"
            : daysUntilNextCycle === 0
              ? "Hoje"
              : daysUntilNextCycle < 0
                ? "Em curso"
                : `${daysUntilNextCycle} ${
                    daysUntilNextCycle === 1 ? "dia" : "dias"
                  }`;

  return (
    <LinearGradient
      colors={["#fff1f2", "#fdf2f8", "#faf5ff"]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Abrir perfil de ${userName}`}
            activeOpacity={0.85}
            style={styles.headerLeft}
            onPress={() => router.push("/user/profile")}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#fb7185", "#ec4899", "#a855f7"]}
                style={styles.avatar}
              >
                <Text style={styles.avatarEmoji}>👋</Text>
              </LinearGradient>
              <View style={styles.flowerBadge}>
                <Text>🌸</Text>
              </View>
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.greeting}>Oi, que bom ver você! 💕</Text>
              <Text numberOfLines={1} style={styles.userName}>{userName}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Notificações. ${unreadNotificationCount} ${
              unreadNotificationCount === 1 ? "não lida" : "não lidas"
            }`}
            style={styles.notificationButton}
            onPress={() => router.push("/user/notifications")}
          >
            <Ionicons name="notifications" size={24} color="#374151" />
            {unreadNotificationCount > 0 ? (
              <View style={styles.notificationDot}>
                <Text style={styles.notificationDotText}>
                  {unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={cycleInfo.colors as any}
          style={styles.cycleCard}
        >
          <View style={styles.cycleTop}>
            <View style={styles.cycleLeft}>
              <View style={styles.cycleIconBox}>
                <Text style={styles.cycleEmoji}>{cycleInfo.icon}</Text>
              </View>
              <View style={styles.cycleTextContent}>
                <Text style={styles.cycleLabel}>
                  {hasCycleData ? "SEU CALENDÁRIO" : "MEU CICLO"}
                </Text>
                <Text style={styles.cycleTitle}>{cycleInfo.phase}</Text>
              </View>
            </View>
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{cycleInfo.message}</Text>
            {hasCurrentCycleEstimate && (
              <>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Progresso estimado</Text>
                  <Text style={styles.progressValue}>
                    {Math.round(cycleProgress)}%
                  </Text>
                </View>
                <View
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: 100,
                    now: Math.round(cycleProgress),
                  }}
                  style={styles.progressBar}
                >
                  <View
                    style={[styles.progressFill, { width: `${cycleProgress}%` }]}
                  />
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityHint="Abrir calendário menstrual"
            activeOpacity={0.82}
            style={styles.nextPeriod}
            onPress={() => router.push("/user/calendar")}
          >
            <View style={styles.nextPeriodLeft}>
              <View style={styles.droplet}>
                <Ionicons
                  name={hasCycleData ? "water" : cycleError ? "alert" : "add"}
                  size={18}
                  color="#f43f5e"
                />
              </View>
              <View style={styles.nextPeriodCopy}>
                <Text style={styles.nextPeriodText}>{nextPeriodLabel}</Text>
                {hasCycleData && activeCyclePrediction && (
                  <>
                    <Text style={styles.nextPeriodDate}>
                      {formatShortDate(activeCyclePrediction.startDate)}
                    </Text>
                    <Text style={styles.nextPeriodRange}>
                      Intervalo possível: {formatShortDate(
                        activeCyclePrediction.periodStartRange.startDate,
                      )}{" "}
                      a{" "}
                      {formatShortDate(
                        activeCyclePrediction.periodStartRange.endDate,
                      )}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <Text style={styles.nextPeriodDays}>{nextPeriodValue}</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>O que vamos fazer hoje?</Text>
        </View>

        <View style={styles.actionsRow}>
          {quickActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              style={[
                styles.actionCard,
                index < quickActions.length - 1 && styles.actionCardSpacing,
              ]}
              onPress={() => handleQuickAction(item.link)}
            >
              <LinearGradient
                colors={item.colors as any}
                style={styles.actionGradient}
              >
                <Text style={styles.actionEmoji}>{item.emoji}</Text>
              </LinearGradient>
              <Text style={styles.actionTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <LinearGradient
          colors={dailyColorScheme as any}
          style={styles.dailyCard}
        >
          <View style={styles.dailyHeader}>
            <Text style={styles.dailyTitle}>{dailyIcon} Mensagem do Dia</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Trocar mensagem do dia"
              accessibilityState={{ busy: isRefreshingDailyMessage }}
              style={styles.refreshButton}
              onPress={refreshDailyMessage}
              disabled={isRefreshingDailyMessage}
            >
              <Ionicons name="refresh" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.dailyText}>
            &ldquo;{dailyMessage}&rdquo;
          </Text>
          {dailyMessageError ? (
            <Text accessibilityRole="alert" style={styles.dailyErrorText}>
              {dailyMessageError}
            </Text>
          ) : null}
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Seus Lembretes</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.seeAllButton}
            onPress={() => router.push("/user/reminders")}
          >
            <Text style={styles.seeAllText}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        {isRemindersLoading ? (
          <View style={styles.emptyRemindersContainer}>
            <Text style={styles.emptyRemindersSubtitle}>Carregando lembretes...</Text>
          </View>
        ) : remindersError ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar lembretes novamente"
            style={styles.emptyRemindersContainer}
            onPress={() => void refreshReminders()}
          >
            <Text style={styles.remindersErrorText}>
              {remindersError} Toque para tentar novamente.
            </Text>
          </TouchableOpacity>
        ) : reminders.length === 0 ? (
          <View style={styles.emptyRemindersContainer}>
            <Text style={styles.emptyRemindersEmoji}>📭</Text>
            <Text style={styles.emptyRemindersTitle}>Você não tem nenhum lembrete</Text>
            <Text style={styles.emptyRemindersSubtitle}>
              Crie seu primeiro lembrete clicando em &ldquo;Ver todos →&rdquo;
            </Text>
          </View>
        ) : (
          reminders.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.86}
              style={styles.reminderCard}
              onPress={() => router.push("/user/reminders")}
            >
              <View style={styles.reminderLeft}>
                <View style={styles.reminderEmojiBox}>
                  <Text style={styles.reminderEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.reminderTextWrapper}>
                  <Text style={styles.reminderType}>{item.type}</Text>
                  <Text
                    style={styles.reminderTitle}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.reminderDate}>🕒 {item.date}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#f43f5e" />
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos conteúdos</Text>
        </View>

        {isContentsLoading ? (
          <View style={styles.inlineStatusCard}>
            <Text style={styles.inlineStatusText}>Carregando artigos...</Text>
          </View>
        ) : contentsError && !contentsData ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar artigos novamente"
            style={styles.inlineStatusCard}
            onPress={() => void refetchContents()}
          >
            <Text style={styles.inlineErrorText}>
              Não foi possível carregar os artigos. Toque para tentar novamente.
            </Text>
          </TouchableOpacity>
        ) : contents.length === 0 ? (
          <View style={styles.inlineStatusCard}>
            <Text style={styles.inlineStatusText}>
              Nenhum artigo publicado no momento.
            </Text>
          </View>
        ) : contents.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            style={styles.contentCard}
            onPress={() => handleOpenContentDetail(item.id)}
          >
            <View style={styles.contentRow}>
              {item.imageUrl ? (
                <ContentImage
                  alt=""
                  contentFit="cover"
                  style={styles.contentThumbnail}
                  transition={150}
                  url={item.imageUrl}
                />
              ) : null}
              <View style={styles.contentInfo}>
                <View style={styles.contentBadge}>
                  <Text style={styles.contentBadgeText}>{item.category}</Text>
                </View>
                <Text style={styles.contentTitle}>{item.title}</Text>
                <Text style={styles.contentTime}>
                  📖 {item.time} de leitura
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#f43f5e" />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.exploreButton}
          onPress={() => router.push("/user/content")}
        >
          <Text style={styles.exploreText}>Explorar mais conteúdos ✨</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scroll: {
    alignSelf: "center",
    maxWidth: 760,
    paddingTop: 58,
    paddingBottom: 120,
    paddingHorizontal: 22,
    width: "100%",
  },

  blobTop: {
    position: "absolute",
    top: -120,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: "rgba(236,72,153,0.10)",
  },

  blobBottom: {
    position: "absolute",
    bottom: -140,
    right: -140,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(168,85,247,0.12)",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
  },

  avatarContainer: {
    marginRight: 14,
    position: "relative",
  },

  avatar: {
    width: 66,
    height: 66,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#ec4899",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 8,
  },

  avatarEmoji: {
    fontSize: 30,
  },

  flowerBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,

    width: 24,
    height: 24,
    borderRadius: 999,

    backgroundColor: "#fff0f6",

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 2,
    borderColor: "#fff",

    zIndex: 10,
    elevation: 9,
  },

  greeting: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },

  userName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    flexShrink: 1,
  },

  notificationButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#ffffff",

    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#ec4899",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 8,
  },

  notificationDot: {
    position: "absolute",
    top: 13,
    right: 13,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#f43f5e",
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  notificationDotText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
  },

  cycleCard: {
    borderRadius: 34,
    padding: 24,
    marginBottom: 30,

    shadowColor: "#ec4899",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 14,
    },

    elevation: 10,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  cycleBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
  },

  cycleBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  dayBadge: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },

  dayBadgeText: {
    color: "#be123c",
    fontWeight: "800",
  },

  cycleTop: {
    marginBottom: 22,
  },

  cycleLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  inlineStatusCard: {
    minHeight: 72,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    marginBottom: 16,
  },

  inlineStatusText: {
    color: "#4b5563",
    textAlign: "center",
  },

  inlineErrorText: {
    color: "#b91c1c",
    fontWeight: "600",
    textAlign: "center",
  },

  cycleTextContent: {
    flex: 1,
  },

  cycleIconBox: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.22)",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  cycleEmoji: {
    fontSize: 34,
  },

  cycleLabel: {
    color: "#fdf4ff",
    marginBottom: 6,
    fontWeight: "600",
  },

  cycleTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },

  messageBox: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 26,
    padding: 18,
    marginBottom: 20,
  },

  messageText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  progressLabel: {
    color: "#fff",
    fontWeight: "600",
  },

  progressValue: {
    color: "#fff",
    fontWeight: "800",
  },

  progressBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#fff",
  },

  nextPeriod: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 24,
    padding: 16,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  nextPeriodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  nextPeriodCopy: {
    flex: 1,
    flexShrink: 1,
  },

  droplet: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: "#fff",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 12,
  },

  nextPeriodText: {
    color: "#fff",
    flexShrink: 1,
    fontWeight: "700",
  },

  nextPeriodDate: {
    color: "#fdf2f8",
    fontSize: 11,
    marginTop: 3,
  },

  nextPeriodRange: {
    color: "#fdf2f8",
    fontSize: 10,
    opacity: 0.8,
    marginTop: 1,
  },

  nextPeriodDays: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 18,
    flexShrink: 0,
    marginLeft: 8,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },

  seeAllButton: {
    backgroundColor: "#ffe4e6",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  seeAllText: {
    color: "#e11d48",
    fontWeight: "700",
  },

  actionsRow: {
    flexDirection: "row",
    marginBottom: 30,
  },

  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#ec4899",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 5,
  },

  actionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
  },

  actionCardSpacing: {
    marginRight: 14,
  },

  actionGradient: {
    width: 68,
    height: 68,
    borderRadius: 24,

    justifyContent: "center",
    alignItems: "center",

    marginBottom: 16,
  },

  actionEmoji: {
    fontSize: 32,
  },

  dailyCard: {
    borderRadius: 32,
    padding: 28,
    marginBottom: 30,

    shadowColor: "#fb7185",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },

    elevation: 8,
  },

  dailyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  dailyTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  dailyText: {
    color: "#fff",
    fontSize: 18,
    lineHeight: 30,
  },

  dailyErrorText: {
    color: "#fff",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
    fontWeight: "600",
  },

  reminderCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    padding: 18,
    marginBottom: 16,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    shadowColor: "#ec4899",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 5,
  },

  reminderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  reminderTextWrapper: {
    flex: 1,
    flexShrink: 1,
  },

  reminderEmojiBox: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: "#f3e8ff",

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  reminderEmoji: {
    fontSize: 32,
  },

  reminderType: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "700",
    marginBottom: 4,
  },

  reminderTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },

  reminderDate: {
    color: "#6b7280",
  },

  contentCard: {
    backgroundColor: "#fff",
    borderRadius: 30,
    overflow: "hidden",
    marginBottom: 18,
    paddingHorizontal: 18,
    paddingVertical: 18,

    shadowColor: "#ec4899",
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 5,
  },

  contentRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  contentEmojiBox: {
    width: width * 0.22,
    minHeight: 120,

    justifyContent: "center",
    alignItems: "center",

    alignSelf: "stretch",
  },

  contentEmoji: {
    fontSize: 40,
  },

  contentInfo: {
    flex: 1,
    padding: 0,
  },

  contentThumbnail: {
    backgroundColor: "#f3f4f6",
    borderRadius: 18,
    height: 92,
    marginRight: 14,
    width: 92,
  },

  contentBadge: {
    backgroundColor: "#ffe4e6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginBottom: 10,
  },

  contentBadgeText: {
    color: "#e11d48",
    fontWeight: "800",
    fontSize: 12,
  },

  contentTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
  },

  contentTime: {
    color: "#6b7280",
  },

  exploreButton: {
    backgroundColor: "#fff",
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 30,

    borderWidth: 1.5,
    borderColor: "#fbcfe8",
  },

  exploreText: {
    color: "#be185d",
    fontSize: 16,
    fontWeight: "800",
  },

  emptyRemindersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyRemindersEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },

  emptyRemindersTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },

  emptyRemindersSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },

  remindersErrorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});
