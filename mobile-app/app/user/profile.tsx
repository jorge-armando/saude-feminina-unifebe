import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'expo-router';

export default function ProfilePage() {
  const [name, setName] = useState('Maria Silva');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);

  const router = useRouter();

  const healthInfo = [
    { label: 'Próxima menstruação', value: '5 de Março', icon: '🌸' },
    { label: 'Duração', value: '5 dias', icon: '📊' },
    { label: 'Ciclo', value: '28 dias', icon: '📅' },
    { label: 'Fase atual', value: 'Fase Lútea', icon: '🌙' },
  ];

  const menuItems = [
    {
      id: 'cycle',
      title: 'Configurações do Ciclo',
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
      id: 'privacy',
      title: 'Privacidade',
      icon: 'lock-closed-outline',
      color: '#34d399',
    },
    {
      id: 'help',
      title: 'Ajuda e Suporte',
      icon: 'help-circle-outline',
      color: '#fb923c',
    },
  ];

  const handleSaveName = async () => {
    if (editedName.trim()) {
      setName(editedName.trim());
      await AsyncStorage.setItem('userName', editedName.trim());
      setIsEditingName(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('hasCompletedWelcome');
    await AsyncStorage.removeItem('userName');
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

                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{name}</Text>

                  <Badge gradient={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.3)'] as const}>
                    Membro desde Mar 2026
                  </Badge>
                </View>

                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setEditedName(name);
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
              <TouchableOpacity style={styles.menuItem}>
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

        <Animated.View entering={FadeInDown.delay(800).springify()} style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Sair da conta</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(900).springify()} style={styles.privacyNote}>
          <Text style={styles.privacyText}>Seus dados são protegidos e privados 🔒</Text>
        </Animated.View>
      </ScrollView>

      <Modal visible={isEditingName} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✏️ Editar Perfil</Text>

              <TouchableOpacity onPress={() => setIsEditingName(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Nome completo 👤</Text>

            <TextInput
              style={styles.input}
              placeholder="Digite seu nome"
              placeholderTextColor="#9ca3af"
              value={editedName}
              onChangeText={setEditedName}
              autoFocus
            />

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

<TouchableOpacity style={styles.saveButton} onPress={handleSaveName}>
  <Text style={styles.saveText}>✓ Salvar</Text>
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

  profileInfo: {
    flex: 1,
  },

  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },

  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },

  healthValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
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
    color: '#9ca3af',
  },

  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },

  privacyNote: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  privacyText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
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