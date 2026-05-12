import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function HomePage() {
  const [userName, setUserName] = useState('Maria');

  const currentDay = 12;
  const cycleLength = 28;

  useEffect(() => {
    async function loadUser() {
      const savedName = await AsyncStorage.getItem('userName');

      if (savedName) {
        setUserName(savedName);
      }
    }

    loadUser();
  }, []);

  const quickActions = [
    {
      title: 'Meu Ciclo',
      emoji: '🌸',
      colors: ['#fb7185', '#ec4899'],
    },
    {
      title: 'Conteúdos',
      emoji: '📚',
      colors: ['#a78bfa', '#8b5cf6'],
    },
  ];

  const reminders = [
    {
      type: 'Exame',
      title: 'Papanicolau',
      date: '22 de Março',
      emoji: '🏥',
    },
    {
      type: 'Consulta',
      title: 'Ginecologista',
      date: '5 de Abril',
      emoji: '👩‍⚕️',
    },
  ];

  const contents = [
    {
      title: 'O que é a fase lútea?',
      category: 'Para você hoje',
      time: '3 min',
      emoji: '🌙',
      colors: ['#fb7185', '#fda4af'],
    },
    {
      title: 'Receitas ricas em magnésio',
      category: 'Alimentação',
      time: '5 min',
      emoji: '🥗',
      colors: ['#34d399', '#2dd4bf'],
    },
  ];

  const getCyclePhase = () => {
    if (currentDay <= 5) {
      return {
        phase: 'Menstruação',
        icon: '🌺',
        message: 'Descanse e se cuide com carinho',
        colors: ['#ef4444', '#fb7185'],
      };
    }

    if (currentDay <= 13) {
      return {
        phase: 'Fase Folicular',
        icon: '🌱',
        message: 'Sua energia está crescendo!',
        colors: ['#10b981', '#34d399'],
      };
    }

    if (currentDay <= 16) {
      return {
        phase: 'Ovulação',
        icon: '✨',
        message: 'Momento de pico de energia',
        colors: ['#a78bfa', '#ec4899'],
      };
    }

    return {
      phase: 'Fase Lútea',
      icon: '🌙',
      message: 'Acolha suas necessidades',
      colors: ['#3b82f6', '#6366f1'],
    };
  };

  const cycleInfo = getCyclePhase();
  const cycleProgress = (currentDay / cycleLength) * 100;

  return (
    <LinearGradient
      colors={['#fff1f2', '#fdf2f8', '#faf5ff']}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      {/* Blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#fb7185', '#ec4899', '#a855f7']}
                style={styles.avatar}
              >
                <Text style={styles.avatarEmoji}>👋</Text>
              </LinearGradient>

              <View style={styles.flowerBadge}>
                <Text>🌸</Text>
              </View>
            </View>

            <View>
              <Text style={styles.greeting}>
                Oi, que bom ver você! 💕
              </Text>

              <Text style={styles.userName}>
                {userName}
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons
              name="notifications"
              size={24}
              color="#374151"
            />

            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* CARD CICLO */}
        <LinearGradient
          colors={cycleInfo.colors as any}
          style={styles.cycleCard}
        >
          <View style={styles.cycleTop}>
            <View style={styles.cycleLeft}>
              <Text style={styles.cycleEmoji}>
                {cycleInfo.icon}
              </Text>

              <View>
                <Text style={styles.cycleLabel}>
                  Você está na
                </Text>

                <Text style={styles.cycleTitle}>
                  {cycleInfo.phase}
                </Text>
              </View>
            </View>

            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>
                Dia {currentDay}
              </Text>
            </View>
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {cycleInfo.message}
            </Text>

            <View style={styles.progressHeader}>
              <Text style={styles.progressText}>
                Progresso do ciclo
              </Text>

              <Text style={styles.progressText}>
                {Math.round(cycleProgress)}%
              </Text>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${cycleProgress}%`,
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.nextPeriod}>
            <View style={styles.nextPeriodLeft}>
              <View style={styles.droplet}>
                <Ionicons
                  name="water"
                  size={18}
                  color="#f43f5e"
                />
              </View>

              <Text style={styles.nextPeriodText}>
                Próxima menstruação
              </Text>
            </View>

            <Text style={styles.nextPeriodDays}>
              {cycleLength - currentDay} dias
            </Text>
          </View>
        </LinearGradient>

        {/* AÇÕES */}
        <Text style={styles.sectionTitle}>
          O que vamos fazer hoje? ✨
        </Text>

        <View style={styles.actions}>
          {quickActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.85}
              style={styles.actionButton}
            >
              <LinearGradient
                colors={item.colors as any}
                style={styles.actionGradient}
              >
                <Text style={styles.actionEmoji}>
                  {item.emoji}
                </Text>

                <Text style={styles.actionTitle}>
                  {item.title}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* MENSAGEM */}
        <LinearGradient
          colors={['#f59e0b', '#fb7185', '#a855f7']}
          style={styles.dailyCard}
        >
          <Text style={styles.dailyTitle}>
            💝 Mensagem do Dia
          </Text>

          <Text style={styles.dailyText}>
            "Cada fase do seu ciclo é uma oportunidade
            de se conhecer melhor."
          </Text>
        </LinearGradient>

        {/* LEMBRETES */}
        <Text style={styles.sectionTitle}>
          Seus Lembretes 📌
        </Text>

        {reminders.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.85}
            style={styles.reminderCard}
          >
            <View style={styles.reminderLeft}>
              <View style={styles.reminderEmojiBox}>
                <Text style={styles.reminderEmoji}>
                  {item.emoji}
                </Text>
              </View>

              <View>
                <Text style={styles.reminderType}>
                  {item.type}
                </Text>

                <Text style={styles.reminderTitle}>
                  {item.title}
                </Text>

                <Text style={styles.reminderDate}>
                  🕒 {item.date}
                </Text>
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#f43f5e"
            />
          </TouchableOpacity>
        ))}

        {/* CONTEÚDOS */}
        <Text style={styles.sectionTitle}>
          Últimos conteúdos 💌
        </Text>

        {contents.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.85}
            style={styles.contentCard}
          >
            <View style={styles.contentRow}>
              <LinearGradient
                colors={item.colors as any}
                style={styles.contentEmojiBox}
              >
                <Text style={styles.contentEmoji}>
                  {item.emoji}
                </Text>
              </LinearGradient>

              <View style={styles.contentInfo}>
                <View style={styles.contentBadge}>
                  <Text style={styles.contentBadgeText}>
                    {item.category}
                  </Text>
                </View>

                <Text style={styles.contentTitle}>
                  {item.title}
                </Text>

                <Text style={styles.contentTime}>
                  📖 {item.time} de leitura
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#f43f5e"
              />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scroll: {
    paddingTop: 60,
    paddingBottom: 120,
    paddingHorizontal: 24,
  },

  blobTop: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(236,72,153,0.15)',
  },

  blobBottom: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(168,85,247,0.15)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarContainer: {
    marginRight: 14,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarEmoji: {
    fontSize: 30,
  },

  flowerBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: '#f59e0b',
    justifyContent: 'center',
    alignItems: 'center',
  },

  greeting: {
    fontSize: 14,
    color: '#6b7280',
  },

  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },

  notificationButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#f43f5e',
  },

  cycleCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 28,
  },

  cycleTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  cycleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cycleEmoji: {
    fontSize: 36,
    marginRight: 16,
  },

  cycleLabel: {
    color: '#fff',
    marginBottom: 4,
  },

  cycleTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },

  dayBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },

  dayBadgeText: {
    color: '#e11d48',
    fontWeight: 'bold',
  },

  messageBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },

  messageText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 16,
    fontStyle: 'italic',
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  progressText: {
    color: '#fff',
    fontWeight: '600',
  },

  progressBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 999,
  },

  nextPeriod: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  nextPeriodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  droplet: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  nextPeriodText: {
    color: '#fff',
    fontWeight: '600',
  },

  nextPeriodDays: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 18,
  },

  actions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },

  actionButton: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },

  actionGradient: {
    paddingVertical: 28,
    alignItems: 'center',
  },

  actionEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },

  actionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },

  dailyCard: {
    borderRadius: 32,
    padding: 28,
    marginBottom: 28,
  },

  dailyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  dailyText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 36,
    fontStyle: 'italic',
  },

  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  reminderEmojiBox: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  reminderEmoji: {
    fontSize: 30,
  },

  reminderType: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: 'bold',
    marginBottom: 4,
  },

  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },

  reminderDate: {
    color: '#6b7280',
  },

  contentCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 18,
  },

  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentEmojiBox: {
    width: width * 0.24,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentEmoji: {
    fontSize: 42,
  },

  contentInfo: {
    flex: 1,
    padding: 18,
  },

  contentBadge: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },

  contentBadgeText: {
    color: '#e11d48',
    fontWeight: 'bold',
    fontSize: 12,
  },

  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },

  contentTime: {
    color: '#6b7280',
  },
});