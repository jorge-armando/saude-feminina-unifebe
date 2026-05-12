import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
      link: '/calendar' as const,
    },
    {
      title: 'Conteúdos',
      emoji: '📚',
      colors: ['#a78bfa', '#8b5cf6'],
      link: '/content' as const,
    },
  ] as const;

  const reminders = [
    {
      type: 'Exame',
      title: 'Papanicolau',
      date: '22 de Março',
      emoji: '🏥',
    },
    {
      type: 'Consulta',
      title: 'Ginecologista - Dra. Ana',
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
    {
      title: 'Exercícios para TPM',
      category: 'Bem-estar',
      time: '4 min',
      emoji: '🧘‍♀️',
      colors: ['#fbbf24', '#fb923c'],
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

      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.headerLeft}
            onPress={() => router.push('/profile')}
          >
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
              <Text style={styles.greeting}>Oi, que bom ver você! 💕</Text>
              <Text style={styles.userName}>{userName}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications" size={24} color="#374151" />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={cycleInfo.colors as any} style={styles.cycleCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cycleBadge}>
              <Text style={styles.cycleBadgeText}>Ciclo atual</Text>
            </View>
            <View style={styles.dayBadge}>
              <Text style={styles.dayBadgeText}>Dia {currentDay}</Text>
            </View>
          </View>

          <View style={styles.cycleTop}>
            <View style={styles.cycleLeft}>
              <View style={styles.cycleIconBox}>
                <Text style={styles.cycleEmoji}>{cycleInfo.icon}</Text>
              </View>
              <View>
                <Text style={styles.cycleLabel}>Você está na</Text>
                <Text style={styles.cycleTitle}>{cycleInfo.phase}</Text>
              </View>
            </View>
          </View>

          <View style={styles.messageBox}>
            <Text style={styles.messageText}>{cycleInfo.message}</Text>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progresso do ciclo</Text>
              <Text style={styles.progressValue}>{Math.round(cycleProgress)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${cycleProgress}%` }]} />
            </View>
          </View>

          <View style={styles.nextPeriod}>
            <View style={styles.nextPeriodLeft}>
              <View style={styles.droplet}>
                <Ionicons name="water" size={18} color="#f43f5e" />
              </View>
              <Text style={styles.nextPeriodText}>Próxima menstruação</Text>
            </View>
            <Text style={styles.nextPeriodDays}>{cycleLength - currentDay} dias</Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>O que vamos fazer hoje?</Text>
        </View>

        <View style={styles.actionsRow}>
          {quickActions.map((item, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.88}
              style={styles.actionCard}
              onPress={() => router.push(item.link)}
            >
              <LinearGradient colors={item.colors as any} style={styles.actionGradient}>
                <Text style={styles.actionEmoji}>{item.emoji}</Text>
              </LinearGradient>
              <Text style={styles.actionTitle}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <LinearGradient colors={['#f59e0b', '#fb7185', '#a855f7']} style={styles.dailyCard}>
          <Text style={styles.dailyTitle}>💝 Mensagem do Dia</Text>
          <Text style={styles.dailyText}>
            "Cada fase do seu ciclo é uma oportunidade de se conhecer melhor. Seja gentil com você mesma."
          </Text>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Seus Lembretes</Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.seeAllButton}
            onPress={() => router.push('/reminders')}
          >
            <Text style={styles.seeAllText}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        {reminders.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.86}
            style={styles.reminderCard}
            onPress={() => router.push('/reminders')}
          >
            <View style={styles.reminderLeft}>
              <View style={styles.reminderEmojiBox}>
                <Text style={styles.reminderEmoji}>{item.emoji}</Text>
              </View>
              <View>
                <Text style={styles.reminderType}>{item.type}</Text>
                <Text style={styles.reminderTitle}>{item.title}</Text>
                <Text style={styles.reminderDate}>🕒 {item.date}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#f43f5e" />
          </TouchableOpacity>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos conteúdos</Text>
        </View>

        {contents.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.86}
            style={styles.contentCard}
            onPress={() => router.push('/content')}
          >
            <View style={styles.contentRow}>
              <LinearGradient colors={item.colors as any} style={styles.contentEmojiBox}>
                <Text style={styles.contentEmoji}>{item.emoji}</Text>
              </LinearGradient>
              <View style={styles.contentInfo}>
                <View style={styles.contentBadge}>
                  <Text style={styles.contentBadgeText}>{item.category}</Text>
                </View>
                <Text style={styles.contentTitle}>{item.title}</Text>
                <Text style={styles.contentTime}>📖 {item.time} de leitura</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#f43f5e" />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.exploreButton}
          onPress={() => router.push('/content')}
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
    paddingTop: 60,
    paddingBottom: 120,
    paddingHorizontal: 24,
  },

  blobTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(236,72,153,0.15)',
  },

  blobBottom: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: 'rgba(244,63,94,0.18)',
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
    flex: 1,
  },

  avatarContainer: {
    marginRight: 14,
  },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarEmoji: {
    fontSize: 30,
  },

  flowerBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fde68a',
  },

  greeting: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },

  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
  },

  notificationButton: {
    width: 56,
    height: 56,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f43f5e',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 8,
  },

  notificationDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#f43f5e',
    borderWidth: 2,
    borderColor: '#fff',
  },

  cycleCard: {
    borderRadius: 32,
    padding: 24,
    marginBottom: 28,
    shadowColor: '#f43f5e',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 28,
    elevation: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  cycleBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  cycleBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },

  dayBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },

  dayBadgeText: {
    color: '#b91c1c',
    fontWeight: '800',
  },

  cycleTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  cycleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cycleIconBox: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#ffffff',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },

  cycleEmoji: {
    fontSize: 32,
  },

  cycleLabel: {
    color: '#f3f4f6',
    marginBottom: 6,
    fontWeight: '600',
  },

  cycleTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },

  messageBox: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },

  messageText: {
    color: '#fafafa',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  progressLabel: {
    color: '#f9fafb',
    fontWeight: '600',
  },

  progressValue: {
    color: '#f9fafb',
    fontWeight: '800',
  },

  progressBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },

  nextPeriod: {
    backgroundColor: 'rgba(255,255,255,0.22)',
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
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  },

  nextPeriodText: {
    color: '#fff',
    fontWeight: '700',
  },

  nextPeriodDays: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },

  seeAllButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(248,113,113,0.12)',
  },

  seeAllText: {
    color: '#be123c',
    fontWeight: '800',
  },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 18,
    marginRight: 12,
    shadowColor: '#fb7185',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 7,
  },

  actionGradient: {
    width: 64,
    height: 64,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  actionEmoji: {
    fontSize: 30,
  },

  actionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },

  dailyCard: {
    borderRadius: 32,
    padding: 26,
    marginBottom: 28,
    shadowColor: '#f59e0b',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 18 },
    shadowRadius: 30,
    elevation: 8,
  },

  dailyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },

  dailyText: {
    color: '#fff',
    fontSize: 20,
    lineHeight: 30,
  },

  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#f43f5e',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },

  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontWeight: '700',
    marginBottom: 4,
  },

  reminderTitle: {
    fontSize: 16,
    fontWeight: '800',
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
    shadowColor: '#fb7185',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 6,
  },

  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentEmojiBox: {
    width: width * 0.22,
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
    backgroundColor: '#fbe7ef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },

  contentBadgeText: {
    color: '#be123c',
    fontWeight: '800',
    fontSize: 12,
  },

  contentTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },

  contentTime: {
    color: '#6b7280',
  },

  exploreButton: {
    borderWidth: 1.5,
    borderColor: '#fbcfe8',
    borderStyle: 'dashed',
    borderRadius: 28,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 30,
    backgroundColor: 'rgba(251,207,232,0.45)',
  },

  exploreText: {
    color: '#9d174d',
    fontSize: 16,
    fontWeight: '800',
  },
});
