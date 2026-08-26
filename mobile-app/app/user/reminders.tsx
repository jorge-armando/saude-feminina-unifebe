import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BellOff,
  Calendar,
  Check,
  Clock,
  Edit2,
  Plus,
  Trash2,
  X,
} from "lucide-react-native";
import { useNavigationState } from "../../hooks/useNavigationState";
import { useReminders } from "../../hooks/useReminders";
import {
  Reminder,
  ReminderInput,
  ReminderRepeat,
  reminderToDate,
  sortRemindersChronologically,
  validateReminderInput,
} from "../../services/reminders";

interface ReminderFormState {
  title: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  emoji: string;
  notes: string;
  repeat: ReminderRepeat;
}

const EMOJI_OPTIONS = [
  "🏥",
  "👩‍⚕️",
  "💊",
  "📅",
  "🩺",
  "💉",
  "🧪",
  "❤️",
  "🌸",
  "🧘‍♀️",
  "🥗",
  "🌙",
];

const REPEAT_OPTIONS: { value: ReminderRepeat; label: string }[] = [
  { value: "none", label: "Uma vez" },
  { value: "daily", label: "Diário" },
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
];

const REPEAT_LABELS: Record<ReminderRepeat, string> = {
  none: "Não se repete",
  daily: "Repete todos os dias",
  weekly: "Repete toda semana",
  monthly: "Repete todo mês",
  yearly: "Repete todo ano",
};

function createInitialForm(): ReminderFormState {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return {
    title: "",
    day: String(tomorrow.getDate()).padStart(2, "0"),
    month: String(tomorrow.getMonth() + 1).padStart(2, "0"),
    year: String(tomorrow.getFullYear()),
    hour: "09",
    minute: "00",
    emoji: "📅",
    notes: "",
    repeat: "none",
  };
}

function reminderToForm(reminder: Reminder): ReminderFormState {
  return {
    title: reminder.title,
    day: reminder.day,
    month: reminder.month,
    year: reminder.year,
    hour: reminder.hour,
    minute: reminder.minute,
    emoji: reminder.emoji,
    notes: reminder.notes ?? "",
    repeat: reminder.repeat,
  };
}

export default function RemindersPage() {
  const {
    reminders,
    preferences,
    notificationStatus,
    isLoading,
    isSaving,
    error,
    refresh,
    addReminder,
    editReminder,
    removeReminder,
  } = useReminders();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReminderFormState>(createInitialForm);
  const [formError, setFormError] = useState<string | null>(null);

  useNavigationState("/user/reminders");

  const sortedReminders = useMemo(
    () => sortRemindersChronologically(reminders),
    [reminders],
  );

  const openNewReminder = () => {
    setEditingId(null);
    setFormData(createInitialForm());
    setFormError(null);
    setShowModal(true);
  };

  const openEditReminder = (reminder: Reminder) => {
    setEditingId(reminder.id);
    setFormData(reminderToForm(reminder));
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setShowModal(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    setFormError(null);

    try {
      const input: ReminderInput = validateReminderInput(formData, {
        requireFuture: !editingId || formData.repeat === "none",
      });
      if (editingId) {
        await editReminder(editingId, input);
      } else {
        await addReminder(input);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData(createInitialForm());
      void refresh();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível salvar o lembrete.",
      );
    }
  };

  const confirmDelete = (reminder: Reminder) => {
    Alert.alert(
      "Excluir lembrete?",
      `“${reminder.title}” será removido e o alerta agendado será cancelado.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void removeReminder(reminder.id).catch((deleteError) => {
              Alert.alert(
                "Não foi possível excluir",
                deleteError instanceof Error
                  ? deleteError.message
                  : "Tente novamente.",
              );
            });
          },
        },
      ],
    );
  };

  const formatDate = (reminder: Reminder) =>
    reminderToDate(reminder).toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  const notificationMessage = !preferences.appointmentReminders
    ? "Alertas do sistema estão desativados nas preferências. Os registros continuam salvos aqui."
    : notificationStatus === "unsupported"
      ? "Neste ambiente, os lembretes ficam salvos, mas alertas do sistema exigem uma versão instalada do app."
      : notificationStatus === "permission-denied"
        ? "A permissão de notificações foi negada. Ative-a nos ajustes do aparelho para receber alertas."
        : null;

  return (
    <View style={styles.screen}>
      <View style={styles.contentWidth}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text accessibilityRole="header" style={styles.title}>
              Meus lembretes
            </Text>
            <Text style={styles.subtitle}>Compromissos salvos neste aparelho</Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Adicionar lembrete"
            style={styles.addButton}
            onPress={openNewReminder}
          >
            <Plus color="#fff" size={24} />
          </TouchableOpacity>
        </View>

        {notificationMessage ? (
          <View style={styles.notice}>
            <BellOff color="#9f1239" size={20} />
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeText}>{notificationMessage}</Text>
              {notificationStatus === "permission-denied" ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Abrir ajustes de notificação do aparelho"
                  style={styles.noticeAction}
                  onPress={() => void Linking.openSettings()}
                >
                  <Text style={styles.noticeActionText}>Abrir ajustes</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {error ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar lembretes novamente"
            style={styles.errorBanner}
            onPress={() => void refresh()}
          >
            <Text accessibilityRole="alert" style={styles.errorBannerText}>
              {error} Toque para tentar novamente.
            </Text>
          </TouchableOpacity>
        ) : null}

        {isLoading ? (
          <View accessibilityLiveRegion="polite" style={styles.centerState}>
            <ActivityIndicator color="#ec4899" size="large" />
            <Text style={styles.centerStateText}>Carregando lembretes...</Text>
          </View>
        ) : sortedReminders.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>Nenhum lembrete ainda</Text>
            <Text style={styles.centerStateText}>
              Use o botão de adicionar para registrar uma consulta, exame ou outro compromisso.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          >
            {sortedReminders.map((reminder) => (
              <View key={reminder.id} style={styles.card}>
                <View style={styles.emojiCircle}>
                  <Text style={styles.emojiText}>{reminder.emoji}</Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{reminder.title}</Text>
                  <View style={styles.detailRow}>
                    <Calendar color="#4b5563" size={15} />
                    <Text style={styles.detailText}>{formatDate(reminder)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock color="#4b5563" size={15} />
                    <Text style={styles.detailText}>
                      {reminder.hour}:{reminder.minute} • {REPEAT_LABELS[reminder.repeat]}
                    </Text>
                  </View>
                  {reminder.notes ? (
                    <Text style={styles.notesText}>{reminder.notes}</Text>
                  ) : null}
                  <Text style={styles.scheduleStatus}>
                    {reminder.notificationId
                      ? "Alerta do sistema agendado"
                      : "Sem alerta do sistema"}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Editar ${reminder.title}`}
                    style={styles.actionButton}
                    onPress={() => openEditReminder(reminder)}
                  >
                    <Edit2 color="#1d4ed8" size={18} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Excluir ${reminder.title}`}
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => confirmDelete(reminder)}
                  >
                    <Trash2 color="#b91c1c" size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <Modal
        visible={showModal}
        animationType="fade"
        transparent
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View accessibilityViewIsModal style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text accessibilityRole="header" style={styles.modalTitle}>
                {editingId ? "Editar lembrete" : "Novo lembrete"}
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar formulário"
                style={styles.closeButton}
                onPress={closeModal}
              >
                <X color="#374151" size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.label}>Ícone</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.emojiRow}
              >
                {EMOJI_OPTIONS.map((emoji) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Usar ícone ${emoji}`}
                    accessibilityState={{ selected: formData.emoji === emoji }}
                    key={emoji}
                    style={[
                      styles.emojiButton,
                      formData.emoji === emoji && styles.emojiButtonActive,
                    ]}
                    onPress={() => setFormData((current) => ({ ...current, emoji }))}
                  >
                    <Text style={styles.emojiButtonText}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {formData.repeat !== "none" ? (
                <Text style={styles.repeatHint}>
                  Para iniciar uma repetição nova, escolha a próxima ocorrência desse horário.
                </Text>
              ) : null}

              <Text style={styles.label}>Título</Text>
              <TextInput
                accessibilityLabel="Título do lembrete"
                value={formData.title}
                onChangeText={(title) => setFormData((current) => ({ ...current, title }))}
                placeholder="Ex.: Consulta com ginecologista"
                placeholderTextColor="#6b7280"
                style={styles.input}
                maxLength={120}
              />

              <Text style={styles.label}>Data</Text>
              <View style={styles.fieldsRow}>
                <TextInput
                  accessibilityLabel="Dia"
                  value={formData.day}
                  onChangeText={(day) =>
                    setFormData((current) => ({ ...current, day: day.replace(/[^0-9]/g, "") }))
                  }
                  placeholder="DD"
                  placeholderTextColor="#6b7280"
                  style={[styles.input, styles.numberInput]}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  accessibilityLabel="Mês"
                  value={formData.month}
                  onChangeText={(month) =>
                    setFormData((current) => ({ ...current, month: month.replace(/[^0-9]/g, "") }))
                  }
                  placeholder="MM"
                  placeholderTextColor="#6b7280"
                  style={[styles.input, styles.numberInput]}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  accessibilityLabel="Ano"
                  value={formData.year}
                  onChangeText={(year) =>
                    setFormData((current) => ({ ...current, year: year.replace(/[^0-9]/g, "") }))
                  }
                  placeholder="AAAA"
                  placeholderTextColor="#6b7280"
                  style={[styles.input, styles.yearInput]}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>

              <Text style={styles.label}>Horário</Text>
              <View style={styles.fieldsRow}>
                <TextInput
                  accessibilityLabel="Hora"
                  value={formData.hour}
                  onChangeText={(hour) =>
                    setFormData((current) => ({ ...current, hour: hour.replace(/[^0-9]/g, "") }))
                  }
                  placeholder="HH"
                  placeholderTextColor="#6b7280"
                  style={[styles.input, styles.numberInput]}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <TextInput
                  accessibilityLabel="Minuto"
                  value={formData.minute}
                  onChangeText={(minute) =>
                    setFormData((current) => ({ ...current, minute: minute.replace(/[^0-9]/g, "") }))
                  }
                  placeholder="MM"
                  placeholderTextColor="#6b7280"
                  style={[styles.input, styles.numberInput]}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <View style={styles.fieldSpacer} />
              </View>

              <Text style={styles.label}>Repetição</Text>
              <ScrollView
                horizontal
                contentContainerStyle={styles.repeatRow}
                showsHorizontalScrollIndicator={false}
              >
                {REPEAT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected: formData.repeat === option.value }}
                    key={option.value}
                    style={[
                      styles.repeatButton,
                      formData.repeat === option.value && styles.repeatButtonActive,
                    ]}
                    onPress={() =>
                      setFormData((current) => ({ ...current, repeat: option.value }))
                    }
                  >
                    <Text
                      style={[
                        styles.repeatButtonText,
                        formData.repeat === option.value && styles.repeatButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Observações (opcional)</Text>
              <TextInput
                accessibilityLabel="Observações do lembrete"
                value={formData.notes}
                onChangeText={(notes) => setFormData((current) => ({ ...current, notes }))}
                placeholder="Ex.: Levar exames anteriores"
                placeholderTextColor="#6b7280"
                style={[styles.input, styles.textArea]}
                multiline
                maxLength={1000}
              />

              {formError ? (
                <Text accessibilityRole="alert" style={styles.formError}>
                  {formError}
                </Text>
              ) : null}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={isSaving}
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeModal}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityState={{ busy: isSaving }}
                  disabled={isSaving}
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={() => void handleSubmit()}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.saveButtonContent}>
                      <Check color="#fff" size={18} />
                      <Text style={styles.saveButtonText}>
                        {editingId ? "Salvar" : "Adicionar"}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff5f8" },
  contentWidth: { alignSelf: "center", flex: 1, maxWidth: 760, width: "100%" },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerCopy: { flex: 1, marginRight: 12 },
  title: { color: "#111827", fontSize: 27, fontWeight: "800" },
  subtitle: { color: "#4b5563", fontSize: 14, marginTop: 4 },
  addButton: {
    alignItems: "center",
    backgroundColor: "#ec4899",
    borderRadius: 22,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  notice: {
    alignItems: "flex-start",
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 12,
    marginHorizontal: 20,
    padding: 13,
  },
  noticeCopy: { flex: 1, marginLeft: 10 },
  noticeText: { color: "#881337", fontSize: 13, lineHeight: 19 },
  noticeAction: { marginTop: 8 },
  noticeActionText: { color: "#be123c", fontSize: 13, fontWeight: "800" },
  errorBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    marginHorizontal: 20,
    padding: 12,
  },
  errorBannerText: { color: "#991b1b", fontSize: 13, lineHeight: 19, textAlign: "center" },
  centerState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 32,
  },
  centerStateText: { color: "#4b5563", lineHeight: 21, marginTop: 12, textAlign: "center" },
  emptyEmoji: { fontSize: 54 },
  emptyTitle: { color: "#111827", fontSize: 20, fontWeight: "800", marginTop: 14 },
  listContainer: { paddingBottom: 32, paddingHorizontal: 20 },
  card: {
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 22,
    elevation: 3,
    flexDirection: "row",
    marginBottom: 14,
    padding: 16,
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  emojiCircle: {
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    borderRadius: 18,
    height: 56,
    justifyContent: "center",
    marginRight: 12,
    width: 56,
  },
  emojiText: { fontSize: 25 },
  cardBody: { flex: 1 },
  cardTitle: { color: "#111827", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  detailRow: { alignItems: "center", flexDirection: "row", marginBottom: 5 },
  detailText: { color: "#4b5563", flex: 1, fontSize: 13, lineHeight: 18, marginLeft: 7 },
  notesText: { color: "#374151", fontSize: 13, lineHeight: 19, marginTop: 5 },
  scheduleStatus: { color: "#7e22ce", fontSize: 11, fontWeight: "700", marginTop: 8 },
  cardActions: { marginLeft: 8 },
  actionButton: {
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 15,
    height: 44,
    justifyContent: "center",
    marginBottom: 8,
    width: 44,
  },
  deleteButton: { backgroundColor: "#fee2e2" },
  modalOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 26,
    maxHeight: "92%",
    maxWidth: 560,
    overflow: "hidden",
    width: "100%",
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: "#e5e7eb",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 18,
  },
  modalTitle: { color: "#111827", fontSize: 20, fontWeight: "800" },
  closeButton: { alignItems: "center", borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  modalBody: { padding: 20, paddingBottom: 28 },
  label: { color: "#374151", fontSize: 14, fontWeight: "700", marginBottom: 8 },
  emojiRow: { paddingBottom: 16 },
  emojiButton: {
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    height: 48,
    justifyContent: "center",
    marginRight: 9,
    width: 48,
  },
  emojiButtonActive: { backgroundColor: "#fbcfe8", borderColor: "#ec4899", borderWidth: 2 },
  emojiButtonText: { fontSize: 23 },
  input: {
    backgroundColor: "#f8fafc",
    borderColor: "#d1d5db",
    borderRadius: 15,
    borderWidth: 1,
    color: "#111827",
    fontSize: 16,
    marginBottom: 16,
    minHeight: 50,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldsRow: { flexDirection: "row", marginHorizontal: -5 },
  numberInput: { flex: 1, marginHorizontal: 5, textAlign: "center" },
  yearInput: { flex: 1.5, marginHorizontal: 5, textAlign: "center" },
  fieldSpacer: { flex: 1.5, marginHorizontal: 5 },
  repeatRow: { paddingBottom: 16 },
  repeatButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 999,
    justifyContent: "center",
    marginRight: 8,
    minHeight: 44,
    paddingHorizontal: 15,
  },
  repeatButtonActive: { backgroundColor: "#ec4899" },
  repeatButtonText: { color: "#4b5563", fontSize: 13, fontWeight: "700" },
  repeatButtonTextActive: { color: "#fff" },
  repeatHint: { color: "#6b7280", fontSize: 12, lineHeight: 18, marginBottom: 16, marginTop: -8 },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  formError: { color: "#b91c1c", fontSize: 13, lineHeight: 19, marginBottom: 12 },
  modalButtons: { flexDirection: "row", marginHorizontal: -6, marginTop: 4 },
  modalButton: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 6,
    minHeight: 50,
  },
  cancelButton: { backgroundColor: "#f3f4f6" },
  cancelButtonText: { color: "#374151", fontWeight: "700" },
  saveButton: { backgroundColor: "#ec4899" },
  saveButtonContent: { alignItems: "center", flexDirection: "row" },
  saveButtonText: { color: "#fff", fontSize: 15, fontWeight: "800", marginLeft: 7 },
});
