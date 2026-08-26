import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsFocused } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useNavigationState } from '../../hooks/useNavigationState';
import { useMenstrualCycles } from '../../hooks/useMenstrualCycles';
import { useCycleTracking } from '../../services/useCycleTracking';
import {
  compareLocalDates,
  formatLongDate,
  toLocalDate,
} from '../../services/menstrualCycle';
import {
  loadLocalUserProfile,
  MAX_USER_NAME_LENGTH,
  updateLocalUserName,
} from '../../services/userProfile';
import { clearLocalAppData } from '../../services/appData';
import { useReminders } from '../../hooks/useReminders';

export default function ProfilePage() {
  const [name, setName] = useState('Usuária');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isResettingData, setIsResettingData] = useState(false);
  const isFocused = useIsFocused();
  const {
    preferences,
    notificationStatus,
    isLoading: isPreferencesLoading,
    isSaving: isPreferencesSaving,
    error: preferencesError,
    changePreferences,
  } = useReminders();
  const {
    records: cycleRecords,
    isLoading: isCycleLoading,
    error: cycleError,
  } = useMenstrualCycles();
  const { prediction: cyclePrediction } = useCycleTracking(cycleRecords);

  useNavigationState('/user/profile');

  const activeCyclePrediction =
    cyclePrediction?.predictionAvailable ? cyclePrediction : null;
  const cyclePredictionIsOverdue = Boolean(
    activeCyclePrediction &&
      compareLocalDates(toLocalDate(new Date()), activeCyclePrediction.endDate) > 0
  );

  useEffect(() => {
    async function loadName() {
      try {
        const profile = await loadLocalUserProfile();
        if (profile) {
          setName(profile.name);
          setCreatedAt(profile.createdAt);
        }
      } catch {
        setNameError('Não foi possível carregar o perfil local.');
      }
    }

    if (isFocused) {
      void loadName();
    }
  }, [isFocused]);


  const healthInfo = [
    {
      label: cyclePredictionIsOverdue
        ? 'Última previsão'
        : 'Próxima previsão',
      value: isCycleLoading
        ? 'Carregando...'
        : cycleError
          ? 'Indisponível'
        : activeCyclePrediction
          ? formatLongDate(activeCyclePrediction.startDate)
        : cyclePrediction
          ? 'Previsão pausada'
          : 'Sem previsão',
      icon: '🌸',
    },
    {
      label: 'Duração média',
      value: isCycleLoading
        ? 'Carregando...'
        : cycleError
          ? 'Indisponível'
          : cyclePrediction
            ? `${cyclePrediction.averagePeriodLength} ${
                cyclePrediction.averagePeriodLength === 1 ? 'dia' : 'dias'
              }`
            : '--',
      icon: '📊',
    },
    {
      label:
        cyclePrediction?.basedOnCycles === 1 ? 'Ciclo estimado' : 'Ciclo médio',
      value: isCycleLoading
        ? 'Carregando...'
        : cycleError
          ? 'Indisponível'
          : cyclePrediction
            ? `${cyclePrediction.averageCycleLength} dias`
            : '--',
      icon: '📅',
    },
    {
      label: 'Períodos locais',
      value: isCycleLoading
        ? 'Carregando...'
        : cycleError
          ? 'Indisponível'
          : `${cycleRecords.length} ${
              cycleRecords.length === 1 ? 'período' : 'períodos'
            }`,
      icon: '📱',
    },
  ];

  const menuItems = [
    {
      id: 'cycle',
      title: 'Calendário menstrual',
      icon: 'settings-outline',
      color: '#ec4899',
    },
    {
      id: 'notifications',
      title: 'Notificações',
      icon: 'notifications-outline',
      color: '#a78bfa',
    },
    {
      id: 'help',
      title: 'Ajuda e Suporte',
      icon: 'help-circle-outline',
      color: '#fb923c',
    },
  ];

  const handleSaveName = async () => {
    if (isSavingName) return;

    setIsSavingName(true);
    setNameError(null);

    try {
      const savedName = await updateLocalUserName(editedName);
      setName(savedName);
      setIsEditingName(false);
    } catch (saveError) {
      setNameError(
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível salvar o nome.',
      );
    } finally {
      setIsSavingName(false);
    }
  };

  const memberSinceLabel = createdAt
    ? `Desde ${new Date(createdAt).toLocaleDateString('pt-BR', {
        month: 'short',
        year: 'numeric',
      })}`
    : 'Perfil local';

  const confirmClearLocalData = () => {
    Alert.alert(
      'Apagar todos os dados locais?',
      'Isso remove perfil, períodos, previsões, lembretes e preferências deste aparelho. A ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar dados',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setIsResettingData(true);
              try {
                const result = await clearLocalAppData();
                if (result.notificationCancellationFailed) {
                  Alert.alert(
                    'Dados apagados',
                    'Os dados locais foram removidos, mas o sistema não confirmou o cancelamento de todos os alertas. Verifique as notificações do aparelho.',
                  );
                }
                router.replace('/');
              } catch {
                Alert.alert(
                  'Não foi possível apagar',
                  'Nenhum redirecionamento foi feito. Tente novamente.',
                );
              } finally {
                setIsResettingData(false);
              }
            })();
          },
        },
      ],
    );
  };

  const updatePreference = async (
    key: keyof typeof preferences,
    enabled: boolean,
  ) => {
    try {
      await changePreferences({ [key]: enabled });
    } catch (preferenceError) {
      Alert.alert(
        'Não foi possível atualizar',
        preferenceError instanceof Error
          ? preferenceError.message
          : 'Tente novamente.',
      );
    }
  };

  return (
    <LinearGradient
      colors={['#fce7f3', '#fbcfe8', '#f3e8ff'] as const}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <View>
            <Text style={styles.title}>Meu Perfil 👤</Text>
            <Text style={styles.subtitle}>Gerencie sua conta e configurações</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
          <Card style={styles.profileCard}>
            <LinearGradient
              colors={['#fb7185', '#ec4899', '#8b5cf6'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.profileGradient}
            >
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarEmoji}>👤</Text>
                </View>

                <View style={styles.nameAndBadge}>
                  <Text numberOfLines={2} style={styles.profileName}>{name}</Text>

                  <Badge gradient={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)'] as const}>
                    {memberSinceLabel}
                  </Badge>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Editar nome do perfil"
                  style={styles.editButton}
                  onPress={() => {
                    setEditedName(name);
                    setNameError(null);
                    setIsEditingName(true);
                  }}
                >
                  <Ionicons name="pencil" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionEmoji}>💕 </Text>
            Resumo de Saúde
          </Text>

          <Card style={styles.healthCard}>
            {healthInfo.map((info, index) => (
              <View
                key={index}
                style={[
                  styles.healthItem,
                  index < healthInfo.length - 1 && styles.healthItemBorder,
                ]}
              >
                <View style={styles.healthLeft}>
                  <View style={styles.healthIcon}>
                    <Text style={styles.healthEmoji}>{info.icon}</Text>
                  </View>

                  <Text style={styles.healthLabel}>{info.label}</Text>
                </View>

                <Text style={styles.healthValue}>{info.value}</Text>
              </View>
            ))}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>

          {menuItems.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(500 + index * 50).springify()}
            >
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => {
                  if (item.id === 'help') setIsHelpModalVisible(true);
                  else if (item.id === 'notifications') setIsNotificationsModalVisible(true);
                  else if (item.id === 'cycle') router.push('/user/calendar');
                }}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                  </View>

                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.section}>
          <Card style={styles.appInfoCard}>
            <LinearGradient
              colors={['#f3e8ff', '#fce7f3'] as const}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.appInfoGradient}
            >
              <View style={styles.appInfoHeader}>
                <Ionicons name="heart" size={24} color="#ec4899" />
                <Text style={styles.appInfoTitle}>Minha Saúde Feminina</Text>
              </View>

              <Text style={styles.appInfoVersion}>Versão 1.0.0</Text>

              <Text style={styles.appInfoDescription}>
                Uma parceria entre Medicina e Sistemas de Informação
              </Text>
            </LinearGradient>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(750).springify()} style={styles.section}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Apagar todos os dados deste aparelho"
            accessibilityState={{ busy: isResettingData }}
            disabled={isResettingData}
            onPress={confirmClearLocalData}
            style={styles.clearDataButton}
          >
            {isResettingData ? (
              <ActivityIndicator color="#b91c1c" />
            ) : (
              <Ionicons name="trash-outline" size={22} color="#b91c1c" />
            )}
            <View style={styles.clearDataCopy}>
              <Text style={styles.clearDataTitle}>Apagar dados deste aparelho</Text>
              <Text style={styles.clearDataDescription}>
                Remove perfil, calendário, lembretes e preferências locais.
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={isEditingName}
        animationType="fade"
        transparent
        onRequestClose={() => setIsEditingName(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoider}
        >
        <View style={styles.modalOverlay}>
          <View accessibilityViewIsModal style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Editar Perfil</Text>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar edição do perfil"
                style={styles.modalCloseButton}
                onPress={() => setIsEditingName(false)}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nome completo 👤</Text>

            <TextInput
              style={styles.input}
              placeholder="Digite seu nome"
              placeholderTextColor="#9ca3af"
              value={editedName}
              onChangeText={(value) => {
                setEditedName(value);
                setNameError(null);
              }}
              maxLength={MAX_USER_NAME_LENGTH}
              autoFocus
            />

            {nameError ? (
              <Text accessibilityRole="alert" style={styles.modalErrorText}>
                {nameError}
              </Text>
            ) : null}

            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>💡 Dica</Text>
              <Text style={styles.tipText}>
                Escolha um nome que te represente e faça você se sentir acolhida!
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsEditingName(false)}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ busy: isSavingName }}
                disabled={isSavingName || !editedName.trim()}
                style={[
                  styles.saveButton,
                  (isSavingName || !editedName.trim()) && styles.buttonDisabled,
                ]}
                onPress={handleSaveName}
              >
                {isSavingName ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveText}>✓ Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isHelpModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View accessibilityViewIsModal style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🆘 Ajuda e Suporte</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar ajuda"
                style={styles.modalCloseButton}
                onPress={() => setIsHelpModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Sobre este protótipo</Text>
            <Text style={styles.contactText}>
              Esta é uma versão preliminar acadêmica. Ela não oferece chat ou atendimento médico.
            </Text>
            <Text style={styles.contactText}>
              Em caso de dúvidas sobre sintomas, procure um serviço ou profissional de saúde de sua confiança.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsHelpModalVisible(false)}
              >
                <Text style={styles.cancelText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isNotificationsModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsNotificationsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View accessibilityViewIsModal style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔔 Notificações</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Fechar preferências de notificações"
                style={styles.modalCloseButton}
                onPress={() => setIsNotificationsModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalLabel}>Configure quais avisos deseja receber:</Text>
            {notificationStatus === 'unsupported' ? (
              <Text style={styles.notificationNotice}>
                Alertas do aparelho exigem uma versão instalada. Neste ambiente, as preferências e os lembretes continuam salvos localmente.
              </Text>
            ) : notificationStatus === 'permission-denied' ? (
              <Text style={styles.notificationNotice}>
                A permissão foi negada. Ative as notificações nos ajustes do aparelho.
              </Text>
            ) : null}
            {preferencesError ? (
              <Text accessibilityRole="alert" style={styles.modalErrorText}>
                {preferencesError}
              </Text>
            ) : null}
            <View style={styles.toggleItem}>
              <Text style={styles.modalPrivacyText}>Alertas de compromissos</Text>
              <Switch
                accessibilityLabel="Alertas de compromissos"
                disabled={isPreferencesLoading || isPreferencesSaving}
                value={preferences.appointmentReminders}
                onValueChange={(enabled) =>
                  void updatePreference('appointmentReminders', enabled)
                }
              />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.modalPrivacyText}>Avisos de previsão do ciclo</Text>
              <Switch
                accessibilityLabel="Avisos de previsão do ciclo"
                disabled={isPreferencesLoading || isPreferencesSaving}
                value={preferences.cyclePredictions}
                onValueChange={(enabled) =>
                  void updatePreference('cyclePredictions', enabled)
                }
              />
            </View>
            <View style={styles.toggleItem}>
              <Text style={styles.modalPrivacyText}>Avisos de novos conteúdos</Text>
              <Switch
                accessibilityLabel="Avisos de novos conteúdos"
                disabled={isPreferencesLoading || isPreferencesSaving}
                value={preferences.contentUpdates}
                onValueChange={(enabled) =>
                  void updatePreference('contentUpdates', enabled)
                }
              />
            </View>
            {isPreferencesSaving ? (
              <ActivityIndicator color="#ec4899" style={styles.preferenceLoader} />
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsNotificationsModalVisible(false)}
              >
                <Text style={styles.cancelText}>Fechar</Text>
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
    alignSelf: 'center',
    maxWidth: 760,
    paddingTop: 60,
    paddingBottom: 120,
    width: '100%',
  },

  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },

  section: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },

  sectionEmoji: {
    fontSize: 20,
  },

  profileCard: {
    padding: 0,
    overflow: 'hidden',
  },

  profileGradient: {
    padding: 24,
  },

  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  avatarEmoji: {
    fontSize: 48,
  },

  nameAndBadge: {
    flex: 1,
    alignItems: 'flex-start',
  },

  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },

  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  healthCard: {
    padding: 20,
  },

  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },

  healthItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },

  healthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  healthIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fce7f3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  healthEmoji: {
    fontSize: 20,
  },

  healthLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    flex: 1,
    flexShrink: 1,
  },

  healthValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    flexShrink: 1,
    maxWidth: '45%',
    textAlign: 'right',
  },

  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  appInfoCard: {
    padding: 0,
    overflow: 'hidden',
  },

  appInfoGradient: {
    padding: 20,
  },

  appInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  appInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },

  appInfoVersion: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },

  appInfoDescription: {
    fontSize: 12,
    color: '#6b7280',
  },

  clearDataButton: {
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 72,
    padding: 16,
  },

  clearDataCopy: {
    flex: 1,
    marginLeft: 12,
  },

  clearDataTitle: {
    color: '#991b1b',
    fontSize: 15,
    fontWeight: '800',
  },

  clearDataDescription: {
    color: '#7f1d1d',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },

  modalKeyboardAvoider: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },

  modalCloseButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },

  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },

  contactText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 21,
    marginBottom: 10,
  },

  toggleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },

  modalPrivacyText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    marginRight: 12,
  },

  input: {
    height: 52,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#111827',
  },

  tipBox: {
    marginTop: 18,
    backgroundColor: '#fdf4ff',
    borderRadius: 18,
    padding: 16,
  },

  notificationNotice: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    color: '#9a3412',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
    padding: 10,
  },

  preferenceLoader: {
    marginTop: 8,
  },

  modalErrorText: {
    color: '#b91c1c',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.55,
  },

  tipTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8b5cf6',
    marginBottom: 8,
  },

  tipText: {
    fontSize: 13,
    color: '#7e22ce',
    lineHeight: 20,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#374151',
  },

saveButton: {
  flex: 1,
  height: 48,
  borderRadius: 16,
  backgroundColor: '#ec4899',
  alignItems: 'center',
  justifyContent: 'center',
},
saveText: {
  fontSize: 14,
  fontWeight: '800',
  color: '#ffffff',
},
});
