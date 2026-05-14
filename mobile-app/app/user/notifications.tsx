import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Bell, X, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { useNavigationState } from '../../hooks/useNavigationState';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  read: boolean;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async (): Promise<NotificationItem[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    return [
      {
        id: '1',
        title: 'Lembrete de Exame',
        description: 'Papanicolau agendado para 22 de Março às 14:00',
        time: 'Há 2 horas',
        icon: '🏥',
        read: false,
      },
      {
        id: '2',
        title: 'Novo Artigo',
        description: 'Leia sobre "O que é a fase lútea?"',
        time: 'Há 5 horas',
        icon: '📚',
        read: false,
      },
      {
        id: '3',
        title: 'Próxima Menstruação',
        description: 'Sua menstruação deve começar em 16 dias',
        time: 'Ontem',
        icon: '🌸',
        read: true,
      },
    ];
  };

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      setError('Não foi possível carregar as notificações.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useNavigationState('/user/notifications');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

  const toggleNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              read: true,
            }
          : item
      )
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Bell color="#fff" size={22} />
          </View>

          <View>
            <Text style={styles.title}>Notificações</Text>
            <Text style={styles.subtitle}>
              {unreadCount} não lidas
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={loadNotifications}
            disabled={loading}
          >
            <Text style={styles.refreshText}>
              {loading ? 'Atualizando...' : 'Atualizar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <X color="#4b5563" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      <ScrollView
        contentContainerStyle={styles.notificationsContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff2d7a" />
            <Text style={styles.loadingText}>Carregando notificações...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadNotifications}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Nenhuma notificação encontrada.</Text>
          </View>
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.notificationCard,
                item.read && styles.notificationRead,
              ]}
              onPress={() => toggleNotificationRead(item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.notificationLeft}>
                <View style={styles.notificationIcon}>
                  <Text style={styles.notificationEmoji}>{item.icon}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>

                  <Text style={styles.notificationDescription}>{item.description}</Text>

                  <Text style={styles.notificationTime}>{item.time}</Text>
                </View>
              </View>

              {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.readAllButton}
          onPress={markAllAsRead}
        >
          <Check color="#fff" size={18} />

          <Text style={styles.readAllText}>
            Marcar todas como lidas
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf2f8',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: '#fff',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ff2d7a',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 14,
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },

  subtitle: {
    marginTop: 2,
    fontSize: 14,
    color: '#6b7280',
  },

  notificationsContainer: {
    padding: 16,
    paddingBottom: 30,
  },

  notificationCard: {
    backgroundColor: '#fdf2f8',
    borderRadius: 22,

    padding: 16,
    marginBottom: 14,

    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',

    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  notificationRead: {
    backgroundColor: '#f3f4f6',
  },

  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },

  notificationIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#fff',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 12,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },

    elevation: 2,
  },

  notificationEmoji: {
    fontSize: 22,
  },

  notificationTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },

  notificationDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },

  notificationTime: {
    marginTop: 8,
    fontSize: 12,
    color: '#9ca3af',
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#ff2d7a',
    marginLeft: 10,
    marginTop: 4,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#fee2e9',
  },

  refreshText: {
    color: '#be123c',
    fontSize: 13,
    fontWeight: '700',
  },

  loadingContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: '#6b7280',
  },

  errorContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },

  errorText: {
    fontSize: 15,
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 22,
  },

  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: '#ff2d7a',
  },

  retryText: {
    color: '#fff',
    fontWeight: '700',
  },

  emptyContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },

  emptyText: {
    color: '#6b7280',
    fontSize: 15,
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 16,
    backgroundColor: '#fff',
  },

  readAllButton: {
    height: 56,
    borderRadius: 18,

    backgroundColor: '#ff2d7a',

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 8,
  },

  readAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});