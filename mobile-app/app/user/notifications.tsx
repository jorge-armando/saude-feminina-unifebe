import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { Bell, Check, RefreshCw, Trash2, X } from "lucide-react-native";
import { useAppNotificationState } from "../../hooks/useAppNotificationState";
import { useContents } from "../../hooks/useContents";
import { useMenstrualCycles } from "../../hooks/useMenstrualCycles";
import { useNavigationState } from "../../hooks/useNavigationState";
import { useReminders } from "../../hooks/useReminders";
import { useCycleTracking } from "../../services/useCycleTracking";
import {
  AppNotificationItem,
  buildAppNotifications,
} from "../../services/appNotifications";

export default function NotificationsScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    reminders,
    preferences,
    isLoading: remindersLoading,
    error: remindersError,
    refresh: refreshReminders,
  } = useReminders();
  const {
    records: cycleRecords,
    isLoading: cyclesLoading,
    error: cyclesError,
    refresh: refreshCycles,
  } = useMenstrualCycles();
  const { prediction } = useCycleTracking(cycleRecords);
  const {
    data: contentsData,
    isLoading: contentsLoading,
    error: contentsError,
    refetch: refetchContents,
  } = useContents();
  const {
    state,
    isLoading: stateLoading,
    isSaving: stateSaving,
    error: stateError,
    refresh: refreshState,
    markRead,
    dismiss,
    repair,
  } = useAppNotificationState();

  useNavigationState("/user/notifications");

  const notifications = useMemo(() => {
    const readIds = new Set(state.readIds);
    const dismissedIds = new Set(state.dismissedIds);

    return buildAppNotifications({
      reminders,
      prediction,
      contents: contentsData?.data ?? [],
      preferences,
    })
      .filter((item) => !dismissedIds.has(item.id))
      .map((item) => ({ ...item, read: readIds.has(item.id) }));
  }, [contentsData, prediction, preferences, reminders, state]);

  const unreadCount = notifications.filter((item) => !item.read).length;
  const isLoading =
    remindersLoading || cyclesLoading || contentsLoading || stateLoading;
  const dataError = remindersError || cyclesError ||
    (contentsError ? "Não foi possível consultar os conteúdos." : null);

  const closeScreen = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/user/home");
    }
  };

  const openNotification = async (item: AppNotificationItem) => {
    const saved = await markRead(item.id);
    if (!saved) return;

    if (item.href === "/user/content-detail" && item.params) {
      router.push({ pathname: item.href, params: item.params });
    } else if (item.href === "/user/calendar") {
      router.push("/user/calendar");
    } else {
      router.push("/user/reminders");
    }
  };

  const refreshAll = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    await Promise.allSettled([
      refreshReminders(),
      refreshCycles(),
      refetchContents(),
      refreshState(),
    ]);

    setIsRefreshing(false);
  };

  const markAllAsRead = () => {
    void markRead(notifications.map((item) => item.id));
  };

  const clearAll = () => {
    Alert.alert(
      "Limpar esta lista?",
      "Os compromissos, registros do ciclo e artigos não serão apagados. Apenas os avisos atuais sairão desta central.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar avisos",
          style: "destructive",
          onPress: () => {
            void (async () => {
              const saved = await dismiss(notifications.map((item) => item.id));
              if (saved && Platform.OS !== "web") {
                try {
                  await Notifications.dismissAllNotificationsAsync();
                } catch {
                  // A lista local já foi limpa; a bandeja segue sob controle do sistema.
                }
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentWidth}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <Bell color="#fff" size={22} />
            </View>
            <View style={styles.headerCopy}>
              <Text accessibilityRole="header" numberOfLines={1} style={styles.title}>
                Notificações
              </Text>
              <Text style={styles.subtitle}>
                {unreadCount} {unreadCount === 1 ? "não lida" : "não lidas"}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Atualizar notificações"
              accessibilityState={{ busy: isRefreshing }}
              disabled={isRefreshing}
              style={styles.headerButton}
              onPress={() => void refreshAll()}
            >
              {isRefreshing ? (
                <ActivityIndicator color="#be185d" size="small" />
              ) : (
                <RefreshCw color="#be185d" size={20} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Fechar notificações"
              style={styles.headerButton}
              onPress={closeScreen}
            >
              <X color="#4b5563" size={22} />
            </TouchableOpacity>
          </View>
        </View>

        {stateError ? (
          <View style={styles.errorCard}>
            <Text accessibilityRole="alert" style={styles.errorText}>{stateError}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.errorButton}
              onPress={() => void repair()}
            >
              <Text style={styles.errorButtonText}>Reiniciar estado de leitura</Text>
            </TouchableOpacity>
          </View>
        ) : dataError ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar notificações novamente"
            style={styles.errorCard}
            onPress={() => void refreshAll()}
          >
            <Text accessibilityRole="alert" style={styles.errorText}>
              {dataError} Toque para tentar novamente.
            </Text>
          </TouchableOpacity>
        ) : null}

        {isLoading ? (
          <View accessibilityLiveRegion="polite" style={styles.centerState}>
            <ActivityIndicator size="large" color="#ec4899" />
            <Text style={styles.centerText}>Consultando seus dados locais...</Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyEmoji}>🔕</Text>
            <Text style={styles.emptyTitle}>Tudo tranquilo por aqui</Text>
            <Text style={styles.centerText}>
              Novos lembretes, previsões e conteúdos aparecerão nesta lista conforme suas preferências.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.notificationsContainer}
            showsVerticalScrollIndicator={false}
          >
            {notifications.map((item) => (
              <View
                accessibilityLabel={`${item.title}. ${item.description}. ${
                  item.read ? "Lida" : "Não lida"
                }`}
                key={item.id}
                style={[styles.notificationCard, item.read && styles.notificationRead]}
              >
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${item.title}`}
                  disabled={stateSaving}
                  style={styles.notificationMain}
                  onPress={() => void openNotification(item)}
                >
                  <View style={styles.notificationIcon}>
                    <Text style={styles.notificationEmoji}>{item.icon}</Text>
                  </View>
                  <View style={styles.notificationCopy}>
                    <View style={styles.titleRow}>
                      <Text style={styles.notificationTitle}>{item.title}</Text>
                      {!item.read ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={styles.notificationDescription}>{item.description}</Text>
                    <Text style={styles.notificationContext}>{item.context}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Remover aviso ${item.title}`}
                  disabled={stateSaving}
                  style={styles.dismissButton}
                  onPress={() => void dismiss(item.id)}
                >
                  <Trash2 color="#9f1239" size={18} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {notifications.length > 0 && !isLoading ? (
          <View style={styles.footer}>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={unreadCount === 0 || stateSaving}
              style={[
                styles.readAllButton,
                (unreadCount === 0 || stateSaving) && styles.buttonDisabled,
              ]}
              onPress={markAllAsRead}
            >
              <Check color="#fff" size={18} />
              <Text style={styles.readAllText}>Marcar todas como lidas</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={stateSaving}
              style={styles.clearButton}
              onPress={clearAll}
            >
              <Text style={styles.clearButtonText}>Limpar lista</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fdf2f8", flex: 1 },
  contentWidth: { alignSelf: "center", flex: 1, maxWidth: 760, width: "100%" },
  header: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomColor: "#f1f5f9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 82,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: { alignItems: "center", flex: 1, flexDirection: "row", minWidth: 0 },
  iconContainer: {
    alignItems: "center",
    backgroundColor: "#ec4899",
    borderRadius: 15,
    height: 46,
    justifyContent: "center",
    marginRight: 10,
    width: 46,
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { color: "#111827", fontSize: 21, fontWeight: "800" },
  subtitle: { color: "#4b5563", fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: "row", marginLeft: 6 },
  headerButton: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginLeft: 4,
    width: 44,
  },
  notificationsContainer: { padding: 16, paddingBottom: 24 },
  notificationCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderColor: "#fbcfe8",
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
    flexDirection: "row",
    marginBottom: 12,
    minHeight: 104,
    padding: 12,
    shadowColor: "#831843",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  notificationRead: { backgroundColor: "#f9fafb", borderColor: "#e5e7eb" },
  notificationMain: { alignItems: "flex-start", flex: 1, flexDirection: "row", minWidth: 0 },
  notificationIcon: {
    alignItems: "center",
    backgroundColor: "#fdf2f8",
    borderRadius: 14,
    height: 48,
    justifyContent: "center",
    marginRight: 11,
    width: 48,
  },
  notificationEmoji: { fontSize: 23 },
  notificationCopy: { flex: 1, minWidth: 0 },
  titleRow: { alignItems: "center", flexDirection: "row" },
  notificationTitle: { color: "#111827", flex: 1, fontSize: 16, fontWeight: "800" },
  notificationDescription: { color: "#4b5563", fontSize: 13, lineHeight: 19, marginTop: 4 },
  notificationContext: { color: "#6b7280", fontSize: 12, fontWeight: "600", marginTop: 7 },
  unreadDot: { backgroundColor: "#e11d48", borderRadius: 5, height: 10, marginLeft: 6, width: 10 },
  dismissButton: {
    alignItems: "center",
    borderRadius: 22,
    height: 44,
    justifyContent: "center",
    marginLeft: 5,
    width: 44,
  },
  centerState: { alignItems: "center", flex: 1, justifyContent: "center", padding: 28 },
  centerText: { color: "#4b5563", fontSize: 14, lineHeight: 21, marginTop: 12, textAlign: "center" },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { color: "#111827", fontSize: 20, fontWeight: "800", marginTop: 14 },
  errorCard: {
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 15,
    borderWidth: 1,
    margin: 14,
    padding: 13,
  },
  errorText: { color: "#991b1b", fontSize: 13, lineHeight: 19, textAlign: "center" },
  errorButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  errorButtonText: { color: "#be123c", fontSize: 13, fontWeight: "800" },
  footer: { backgroundColor: "#fff", borderTopColor: "#f3f4f6", borderTopWidth: 1, padding: 12 },
  readAllButton: {
    alignItems: "center",
    backgroundColor: "#ec4899",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 50,
  },
  readAllText: { color: "#fff", fontSize: 14, fontWeight: "800", marginLeft: 7 },
  clearButton: { alignItems: "center", justifyContent: "center", minHeight: 44, marginTop: 4 },
  clearButtonText: { color: "#9f1239", fontSize: 13, fontWeight: "800" },
  buttonDisabled: { opacity: 0.5 },
});
