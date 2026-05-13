import { useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { Plus, X, Calendar, Clock, Trash2, Edit2, Check } from 'lucide-react-native';

interface Reminder {
  id: string;
  title: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  emoji: string;
  notes?: string;
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([
    {
      id: '1',
      title: 'Papanicolau',
      day: '22',
      month: '03',
      year: '2026',
      hour: '14',
      minute: '00',
      emoji: '🏥',
      notes: 'Clínica Dr. Silva',
    },
    {
      id: '2',
      title: 'Ginecologista - Dra. Ana',
      day: '05',
      month: '04',
      year: '2026',
      hour: '09',
      minute: '30',
      emoji: '👩‍⚕️',
      notes: 'Consulta de rotina',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    day: '',
    month: '',
    year: '',
    hour: '00',
    minute: '00',
    emoji: '📅',
    notes: '',
  });

  const emojiOptions = [
    '🏥',
    '👩‍⚕️',
    '💊',
    '📅',
    '🩺',
    '💉',
    '🧪',
    '❤️',
    '🌸',
    '💕',
    '🎀',
    '💝',
    '🩷',
    '🌺',
    '🧘‍♀️',
    '💆‍♀️',
    '🍎',
    '🥗',
    '💪',
    '🌙',
    '☀️',
    '⭐',
    '✨',
    '🌈',
  ];

  const handleSubmit = () => {
    const day = Number(formData.day);
    const month = Number(formData.month);
    const year = Number(formData.year);
    const hour = Number(formData.hour);
    const minute = Number(formData.minute);

    if (
      !formData.title.trim() ||
      !formData.day.trim() ||
      !formData.month.trim() ||
      !formData.year.trim() ||
      !formData.hour.trim() ||
      !formData.minute.trim() ||
      day < 1 ||
      day > 31 ||
      month < 1 ||
      month > 12 ||
      year < 1900 ||
      hour < 0 ||
      hour > 23 ||
      minute < 0 ||
      minute > 59
    ) {
      return;
    }

    const normalizedFormData = {
      ...formData,
      day: formData.day.padStart(2, '0'),
      month: formData.month.padStart(2, '0'),
      hour: formData.hour.padStart(2, '0'),
      minute: formData.minute.padStart(2, '0'),
    };

    if (editingId) {
      setReminders(
        reminders.map((r) =>
          r.id === editingId ? { ...normalizedFormData, id: editingId } : r
        )
      );
    } else {
      const newReminder: Reminder = {
        ...normalizedFormData,
        id: Date.now().toString(),
      };
      setReminders([...reminders, newReminder]);
    }

    closeModal();
  };

  const handleEdit = (reminder: Reminder) => {
    setFormData({
      title: reminder.title,
      day: reminder.day,
      month: reminder.month,
      year: reminder.year,
      hour: reminder.hour,
      minute: reminder.minute,
      emoji: reminder.emoji,
      notes: reminder.notes || '',
    });
    setEditingId(reminder.id);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      title: '',
      day: '',
      month: '',
      year: '',
      hour: '00',
      minute: '00',
      emoji: '📅',
      notes: '',
    });
  };

  const formatDate = (reminder: Reminder) => {
    const date = new Date(
      Number(reminder.year),
      Number(reminder.month) - 1,
      Number(reminder.day)
    );
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (hour: string, minute: string) =>
    `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  const sortedReminders = [...reminders].sort((a, b) => {
    const aDate = new Date(
      Number(a.year),
      Number(a.month) - 1,
      Number(a.day),
      Number(a.hour),
      Number(a.minute)
    ).getTime();

    const bDate = new Date(
      Number(b.year),
      Number(b.month) - 1,
      Number(b.day),
      Number(b.hour),
      Number(b.minute)
    ).getTime();

    return aDate - bDate;
  });

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Meus Lembretes</Text>
          <Text style={styles.subtitle}>Gerencie seus compromissos de saúde</Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => setShowModal(true)}>
          <Plus color="#fff" size={22} />
        </TouchableOpacity>
      </View>

      {sortedReminders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📭</Text>
          <Text style={styles.emptyTitle}>Nenhum lembrete ainda</Text>
          <Text style={styles.emptySubtitle}>
            Adicione seu primeiro lembrete clicando no botão +
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          {sortedReminders.map((reminder) => (
            <View key={reminder.id} style={styles.card}>
              <View style={styles.cardLeft}>
                <View style={styles.emojiCircle}>
                  <Text style={styles.emojiText}>{reminder.emoji}</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>Lembrete</Text>
                </View>
                <Text style={styles.cardTitle}>{reminder.title}</Text>
                <View style={styles.cardDetails}>
                  <View style={styles.detailRow}>
                    <Calendar color="#6b7280" size={14} />
                    <Text style={styles.detailText}>{formatDate(reminder)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Clock color="#6b7280" size={14} />
                    <Text style={styles.detailText}>{formatTime(reminder.hour, reminder.minute)}</Text>
                  </View>
                  {reminder.notes ? (
                    <Text style={styles.notesText}>{reminder.notes}</Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(reminder)}>
                  <Edit2 color="#2563eb" size={18} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => handleDelete(reminder.id)}>
                  <Trash2 color="#dc2626" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={showModal} animationType="fade" transparent>
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <View style={styles.modalBackground} />
        </Pressable>

        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Editar Lembrete' : 'Novo Lembrete'}</Text>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <X color="#374151" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
            <Text style={styles.label}>Ícone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
              {emojiOptions.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiButton,
                    formData.emoji === emoji && styles.emojiButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, emoji })}
                >
                  <Text style={styles.emojiButtonText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Título</Text>
            <TextInput
              value={formData.title}
              onChangeText={(value) => setFormData({ ...formData, title: value })}
              placeholder="Ex: Consulta com ginecologista"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />

            <Text style={styles.label}>Data</Text>
            <View style={styles.dateRow}>
              <TextInput
                value={formData.day}
                onChangeText={(value) => setFormData({ ...formData, day: value.replace(/[^0-9]/g, '') })}
                placeholder="DD"
                placeholderTextColor="#9ca3af"
                style={[styles.input, styles.smallInput]}
                keyboardType="numeric"
                maxLength={2}
              />
              <TextInput
                value={formData.month}
                onChangeText={(value) => setFormData({ ...formData, month: value.replace(/[^0-9]/g, '') })}
                placeholder="MM"
                placeholderTextColor="#9ca3af"
                style={[styles.input, styles.smallInput]}
                keyboardType="numeric"
                maxLength={2}
              />
              <TextInput
                value={formData.year}
                onChangeText={(value) => setFormData({ ...formData, year: value.replace(/[^0-9]/g, '') })}
                placeholder="AAAA"
                placeholderTextColor="#9ca3af"
                style={[styles.input, styles.mediumInput]}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <Text style={styles.label}>Horário</Text>
            <View style={styles.dateRow}>
              <TextInput
                value={formData.hour}
                onChangeText={(value) => setFormData({ ...formData, hour: value.replace(/[^0-9]/g, '') })}
                placeholder="HH"
                placeholderTextColor="#9ca3af"
                style={[styles.input, styles.smallInput]}
                keyboardType="numeric"
                maxLength={2}
              />
              <TextInput
                value={formData.minute}
                onChangeText={(value) => setFormData({ ...formData, minute: value.replace(/[^0-9]/g, '') })}
                placeholder="MM"
                placeholderTextColor="#9ca3af"
                style={[styles.input, styles.smallInput]}
                keyboardType="numeric"
                maxLength={2}
              />
            </View>

            <Text style={styles.label}>Observações (opcional)</Text>
            <TextInput
              value={formData.notes}
              onChangeText={(value) => setFormData({ ...formData, notes: value })}
              placeholder="Ex: Levar exames anteriores"
              placeholderTextColor="#9ca3af"
              style={[styles.input, styles.textArea]}
              multiline
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSubmit}>
                <View style={styles.saveButtonContent}>
                  <Check color="#fff" size={16} />
                  <Text style={styles.saveButtonText}>{editingId ? 'Salvar' : 'Adicionar'}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff5f8',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 24 : 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 14,
  },
  addButton: {
    width: 54,
    height: 54,
    borderRadius: 24,
    backgroundColor: '#ec4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#111827',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#f9a8d4',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardLeft: {
    marginRight: 12,
  },
  emojiCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#d8b4fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 26,
  },
  cardBody: {
    flex: 1,
  },
  tag: {
    backgroundColor: '#fce7f3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  tagText: {
    color: '#be185d',
    fontSize: 12,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  cardDetails: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  detailText: {
    color: '#6b7280',
    fontSize: 13,
  },
  notesText: {
    color: '#374151',
    fontSize: 14,
    marginTop: 8,
  },
  cardActions: {
    marginLeft: 12,
    gap: 12,
  },
  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalBackground: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: '15%',
    bottom: '10%',
    borderRadius: 28,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalBodyContent: {
    paddingBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  emojiRow: {
    marginBottom: 16,
  },
  emojiButton: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  emojiButtonActive: {
    backgroundColor: '#ec4899',
  },
  emojiButtonText: {
    fontSize: 24,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#111827',
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  smallInput: {
    flex: 1,
    textAlign: 'center',
  },
  mediumInput: {
    flex: 1.5,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#ec4899',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});