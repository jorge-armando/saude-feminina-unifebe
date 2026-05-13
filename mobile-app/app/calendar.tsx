import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface NoteItem {
  id: string;
  date: string;
  note: string;
  symptoms: string[];
  emoji: string;
}

export default function CalendarPage() {
  const [currentMonth] = useState('Março 2026');
  const [currentDay] = useState(12);

  const [showNoteModal, setShowNoteModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [selectedDeleteId, setSelectedDeleteId] =
    useState<string | null>(null);

  const [noteText, setNoteText] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] =
    useState<string[]>([]);

  const [selectedEmoji, setSelectedEmoji] =
    useState('💖');

  const daysOfWeek = [
    'Dom',
    'Seg',
    'Ter',
    'Qua',
    'Qui',
    'Sex',
    'Sáb',
  ];

  const calendarDays = Array.from(
    { length: 31 },
    (_, i) => ({
      day: i + 1,
      hasPeriod: i >= 4 && i <= 8,
      isFertile: i >= 10 && i <= 14,
      isToday: i + 1 === currentDay,
      isPredicted: i >= 26,
    })
  );

  const availableSymptoms = [
    { icon: '😊', label: 'Feliz' },
    { icon: '😢', label: 'Triste' },
    { icon: '😴', label: 'Cansaço' },
    { icon: '😡', label: 'Raiva' },
    { icon: '😰', label: 'Ansiedade' },
    { icon: '😌', label: 'Calma' },
    { icon: '🤕', label: 'Dor' },
    { icon: '💢', label: 'Irritação' },
    { icon: '🍔', label: 'Fome' },
    { icon: '⚡', label: 'Energia' },
  ];

  const [notes, setNotes] = useState<NoteItem[]>([
    {
      id: '1',
      date: '10 de Março',
      symptoms: ['Energia alta', 'Ótimo humor'],
      note: 'Me senti muito bem hoje!',
      emoji: '⚡',
    },
    {
      id: '2',
      date: '7 de Março',
      symptoms: ['Cansaço leve'],
      note: 'Dia tranquilo, precisei descansar mais',
      emoji: '😴',
    },
  ]);

  const toggleSymptom = (label: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(label)
        ? prev.filter((s) => s !== label)
        : [...prev, label]
    );
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;

    const today = `${currentDay} de Março`;

    const newNote: NoteItem = {
      id: Date.now().toString(),
      date: today,
      note: noteText,
      symptoms: selectedSymptoms,
      emoji: selectedEmoji,
    };

    setNotes((prev) => [newNote, ...prev]);

    setNoteText('');
    setSelectedSymptoms([]);
    setSelectedEmoji('💖');

    setShowNoteModal(false);
  };

  const deleteNote = (id: string) => {
    setSelectedDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteNote = () => {
    if (!selectedDeleteId) return;

    setNotes((prev) =>
      prev.filter(
        (note) => note.id !== selectedDeleteId
      )
    );

    setShowDeleteModal(false);
    setSelectedDeleteId(null);
  };

  return (
    <LinearGradient
      colors={['#fff1f2', '#fdf2f8', '#faf5ff']}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.header}
        >
          <Text style={styles.title}>
            Meu Calendário 🗓️
          </Text>

          <Text style={styles.subtitle}>
            Acompanhe seu ciclo e registre como
            você se sente
          </Text>
        </Animated.View>

        {/* CALENDÁRIO */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={styles.section}
        >
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.monthButton}
              >
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color="#374151"
                />
              </TouchableOpacity>

              <Text style={styles.monthTitle}>
                {currentMonth}
              </Text>

              <TouchableOpacity
                style={styles.monthButton}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#374151"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDays}>
              {daysOfWeek.map((day) => (
                <Text
                  key={day}
                  style={styles.weekDay}
                >
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((day) => (
                <TouchableOpacity
                  key={day.day}
                  activeOpacity={0.8}
                  style={styles.dayCell}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      day.hasPeriod &&
                        styles.dayPeriod,
                      day.isFertile &&
                        styles.dayFertile,
                      day.isPredicted &&
                        styles.dayPredicted,
                      day.isToday &&
                        styles.dayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        (day.isToday ||
                          day.hasPeriod ||
                          day.isFertile) &&
                          styles.dayTextWhite,
                      ]}
                    >
                      {day.day}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: '#ef4444',
                    },
                  ]}
                />

                <Text style={styles.legendText}>
                  Menstruação
                </Text>
              </View>

              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: '#8b5cf6',
                    },
                  ]}
                />

                <Text style={styles.legendText}>
                  Período fértil
                </Text>
              </View>

              <View style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    {
                      backgroundColor: '#f9a8d4',
                    },
                  ]}
                />

                <Text style={styles.legendText}>
                  Previsão
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* BOTÃO ADICIONAR */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          style={styles.section}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.addButton}
            onPress={() => setShowNoteModal(true)}
          >
            <LinearGradient
              colors={['#fb7185', '#ec4899']}
              style={styles.addGradient}
            >
              <Ionicons
                name="add-circle"
                size={28}
                color="#fff"
              />

              <Text style={styles.addButtonText}>
                Adicionar anotação
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* HISTÓRICO */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.section}
        >
          <Text style={styles.sectionTitle}>
            Histórico de Anotações
          </Text>

          {notes.map((note) => (
            <View
              key={note.id}
              style={styles.noteCard}
            >
              <View style={styles.noteTop}>
                <View style={styles.noteLeft}>
                  <View
                    style={styles.noteEmojiBox}
                  >
                    <Text
                      style={styles.noteEmoji}
                    >
                      {note.emoji}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.noteDate}>
                      {note.date}
                    </Text>

                    <View style={styles.tagsRow}>
                      {note.symptoms.map(
                        (symptom, index) => (
                          <View
                            key={index}
                            style={styles.tag}
                          >
                            <Text
                              style={
                                styles.tagText
                              }
                            >
                              {symptom}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.deleteButton}
                  onPress={() =>
                    deleteNote(note.id)
                  }
                >
                  <Ionicons
                    name="trash-outline"
                    size={18}
                    color="#ef4444"
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.noteText}>
                {note.note}
              </Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* MODAL NOVA ANOTAÇÃO */}
      <Modal
        visible={showNoteModal}
        animationType="slide"
        transparent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Nova anotação ✨
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setShowNoteModal(false)
                }
              >
                <Ionicons
                  name="close"
                  size={26}
                  color="#374151"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>
              Escolha um emoji
            </Text>

            <View style={styles.emojiGrid}>
              {availableSymptoms.map(
                (symptom) => (
                  <TouchableOpacity
                    key={symptom.label}
                    style={[
                      styles.emojiButton,
                      selectedEmoji ===
                        symptom.icon &&
                        styles.emojiButtonActive,
                    ]}
                    onPress={() =>
                      setSelectedEmoji(
                        symptom.icon
                      )
                    }
                  >
                    <Text
                      style={styles.emojiText}
                    >
                      {symptom.icon}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <Text style={styles.modalLabel}>
              Como você se sentiu?
            </Text>

            <View style={styles.symptomsGrid}>
              {availableSymptoms.map(
                (symptom) => (
                  <TouchableOpacity
                    key={symptom.label}
                    style={[
                      styles.symptomButton,
                      selectedSymptoms.includes(
                        symptom.label
                      ) &&
                        styles.symptomButtonActive,
                    ]}
                    onPress={() =>
                      toggleSymptom(
                        symptom.label
                      )
                    }
                  >
                    <Text
                      style={
                        styles.symptomLabel
                      }
                    >
                      {symptom.label}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <Text style={styles.modalLabel}>
              Anotação
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="Escreva como foi seu dia..."
              placeholderTextColor="#9ca3af"
              multiline
              value={noteText}
              onChangeText={setNoteText}
            />

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={handleSaveNote}
            >
              <LinearGradient
                colors={['#fb7185', '#ec4899']}
                style={styles.saveButton}
              >
                <Text
                  style={styles.saveButtonText}
                >
                  Salvar anotação 💖
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL EXCLUIR */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteIconBox}>
              <Ionicons
                name="trash"
                size={34}
                color="#ef4444"
              />
            </View>

            <Text style={styles.deleteTitle}>
              Excluir anotação?
            </Text>

            <Text style={styles.deleteSubtitle}>
              Essa ação não poderá ser desfeita.
            </Text>

            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={
                  styles.cancelDeleteButton
                }
                onPress={() =>
                  setShowDeleteModal(false)
                }
              >
                <Text
                  style={
                    styles.cancelDeleteText
                  }
                >
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.confirmDeleteButton
                }
                onPress={confirmDeleteNote}
              >
                <Text
                  style={
                    styles.confirmDeleteText
                  }
                >
                  Excluir
                </Text>
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
    paddingTop: 60,
    paddingBottom: 120,
  },

  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    lineHeight: 22,
  },

  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },

  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 22,

    shadowColor: '#ec4899',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 6,
  },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },

  monthButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#fdf2f8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  monthTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },

  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  weekDay: {
    width: 40,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#9ca3af',
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },

  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
  },

  dayCircle: {
    flex: 1,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  dayToday: {
    borderWidth: 2,
    borderColor: '#ec4899',
  },

  dayPeriod: {
    backgroundColor: '#ef4444',
  },

  dayFertile: {
    backgroundColor: '#8b5cf6',
  },

  dayPredicted: {
    backgroundColor: '#fbcfe8',
  },

  dayText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '600',
  },

  dayTextWhite: {
    color: '#fff',
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginRight: 6,
  },

  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },

  addButton: {
    borderRadius: 24,
    overflow: 'hidden',
  },

  addGradient: {
    height: 68,
    borderRadius: 24,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 10,
  },

  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },

  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,

    shadowColor: '#ec4899',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 5,
  },

  noteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  noteLeft: {
    flexDirection: 'row',
    flex: 1,
  },

  noteEmojiBox: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#fdf2f8',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 14,
  },

  noteEmoji: {
    fontSize: 30,
  },

  noteDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ec4899',
    marginBottom: 8,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  tag: {
    backgroundColor: '#fce7f3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  tagText: {
    color: '#be185d',
    fontSize: 12,
    fontWeight: '700',
  },

  noteText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#374151',
  },

  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#fef2f2',

    justifyContent: 'center',
    alignItems: 'center',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },

  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    minHeight: '82%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  modalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 14,
    marginTop: 14,
  },

  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  emojiButton: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#f9fafb',

    justifyContent: 'center',
    alignItems: 'center',
  },

  emojiButtonActive: {
    backgroundColor: '#fce7f3',
    borderWidth: 2,
    borderColor: '#ec4899',
  },

  emojiText: {
    fontSize: 28,
  },

  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  symptomButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  symptomButtonActive: {
    backgroundColor: '#fce7f3',
    borderWidth: 1.5,
    borderColor: '#ec4899',
  },

  symptomLabel: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
  },

  textArea: {
    backgroundColor: '#f9fafb',
    borderRadius: 22,
    padding: 18,
    fontSize: 15,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 120,
    marginBottom: 28,
  },

  saveButton: {
    height: 60,
    borderRadius: 22,

    justifyContent: 'center',
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  deleteOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  deleteModal: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 26,
    alignItems: 'center',

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 10,
  },

  deleteIconBox: {
    width: 82,
    height: 82,
    borderRadius: 999,
    backgroundColor: '#fef2f2',

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 20,
  },

  deleteTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },

  deleteSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 26,
  },

  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },

  cancelDeleteButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',

    justifyContent: 'center',
    alignItems: 'center',
  },

  confirmDeleteButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#ef4444',

    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelDeleteText: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '700',
  },

  confirmDeleteText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});