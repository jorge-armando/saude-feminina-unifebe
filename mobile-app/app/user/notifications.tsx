import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Bell, X, Check } from 'lucide-react-native';
import { router } from 'expo-router';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  read: boolean;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([
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
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((item) => ({
        ...item,
        read: true,
      }))
    );
  };

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

        <TouchableOpacity onPress={() => router.back()}>
          <X color="#4b5563" size={24} />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <ScrollView
        contentContainerStyle={styles.notificationsContainer}
        showsVerticalScrollIndicator={false}
      >
        {notifications.map((item) => (
          <View
            key={item.id}
            style={[
              styles.notificationCard,
              item.read && styles.notificationRead,
            ]}
          >
            <View style={styles.notificationLeft}>
              <View style={styles.notificationIcon}>
                <Text style={styles.notificationEmoji}>
                  {item.icon}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.notificationTitle}>
                  {item.title}
                </Text>

                <Text style={styles.notificationDescription}>
                  {item.description}
                </Text>

                <Text style={styles.notificationTime}>
                  {item.time}
                </Text>
              </View>
            </View>

            {!item.read && <View style={styles.unreadDot} />}
          </View>
        ))}
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