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
      id: '1',
      title: 'O que é a fase lútea?',
      category: 'Para você hoje',
      time: '3 min',
      emoji: '🌙',
      colors: ['#fb7185', '#fda4af'],
    },
    {
      id: '2',
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

  const handleQuickAction = (route: string | null) => {
    if (!route) {
      return;
    }

    router.push(route as any);
  };

  const handleOpenContentDetail = (id: string) => {
    router.push({
      pathname: '/content-detail',
      params: { id },
    });
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
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications" size={24} color="#374151" />
            <View style={styles.notificationDot} />
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
              activeOpacity={0.85}
              style={styles.actionButton}
              onPress={() => handleQuickAction(item.route)}
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

        {contents.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.85}
            style={styles.contentCard}
            onPress={() => handleOpenContentDetail(item.id)}
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
    paddingTop: 58,
    paddingBottom: 120,
    paddingHorizontal: 22,
  },

  blobTop: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 999,
    backgroundColor: 'rgba(236,72,153,0.10)',
  },

  blobBottom: {
    position: 'absolute',
    bottom: -140,
    right: -140,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: 'rgba(168,85,247,0.12)',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  avatarContainer: {
    marginRight: 14,
    position: 'relative',
  },

  avatar: {
    width: 66,
    height: 66,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#ec4899',
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
    position: 'absolute',
    bottom: -2,
    right: -2,

    width: 24,
    height: 24,
    borderRadius: 999,

    backgroundColor: '#fff0f6',

    justifyContent: 'center',
    alignItems: 'center',

    borderWidth: 2,
    borderColor: '#fff',

    zIndex: 10,
  },

  greeting: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },

  userName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },

  notificationButton: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: '#ffffff',

    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#ec4899',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 10,
    },

    elevation: 8,
  },

  notificationDot: {
    position: 'absolute',
    top: 13,
    right: 13,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#f43f5e',
    borderWidth: 2,
    borderColor: '#fff',
  },

  cycleCard: {
    borderRadius: 34,
    padding: 24,
    marginBottom: 30,

    shadowColor: '#ec4899',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: {
      width: 0,
      height: 14,
    },

    elevation: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  cycleBadge: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 999,
  },

  cycleBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  dayBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },

  dayBadgeText: {
    color: '#be123c',
    fontWeight: '800',
  },

  cycleTop: {
    marginBottom: 22,
  },

  cycleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  cycleIconBox: {
    width: 68,
    height: 68,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 16,
  },

  cycleEmoji: {
    fontSize: 34,
  },

  cycleLabel: {
    color: '#fdf4ff',
    marginBottom: 6,
    fontWeight: '600',
  },

  cycleTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },

  messageBox: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 26,
    padding: 18,
    marginBottom: 20,
  },

  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 18,
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  progressLabel: {
    color: '#fff',
    fontWeight: '600',
  },

  progressValue: {
    color: '#fff',
    fontWeight: '800',
  },

  progressBar: {
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.28)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#fff',
  },

  nextPeriod: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 24,
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
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#fff',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 12,
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
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  seeAllButton: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },

  seeAllText: {
    color: '#e11d48',
    fontWeight: '700',
  },

  actionsRow: {
    flexDirection: 'row',
    marginBottom: 30,
  },

  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 18,
    marginRight: 14,

    shadowColor: '#ec4899',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 5,
  },

  actionGradient: {
    width: 68,
    height: 68,
    borderRadius: 24,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 16,
  },

  actionEmoji: {
    fontSize: 32,
  },

  actionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },

  dailyCard: {
    borderRadius: 32,
    padding: 28,
    marginBottom: 30,

    shadowColor: '#fb7185',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 12,
    },

    elevation: 8,
  },

  dailyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 14,
  },

  dailyText: {
    color: '#fff',
    fontSize: 18,
    lineHeight: 30,
  },

  reminderCard: {
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 18,
    marginBottom: 16,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    shadowColor: '#ec4899',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 5,
  },

  reminderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  reminderEmojiBox: {
    width: 66,
    height: 66,
    borderRadius: 24,
    backgroundColor: '#f3e8ff',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 16,
  },

  reminderEmoji: {
    fontSize: 32,
  },

  reminderType: {
    fontSize: 12,
    color: '#9ca3af',
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
    borderRadius: 30,
    overflow: 'hidden',
    marginBottom: 18,

    shadowColor: '#ec4899',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 5,
  },

  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  contentEmojiBox: {
    width: width * 0.22,
    minHeight: 120,

    justifyContent: 'center',
    alignItems: 'center',

    alignSelf: 'stretch',
  },

  contentEmoji: {
    fontSize: 40,
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
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 30,

    borderWidth: 1.5,
    borderColor: '#fbcfe8',
  },

  exploreText: {
    color: '#be185d',
    fontSize: 16,
    fontWeight: '800',
  },
});