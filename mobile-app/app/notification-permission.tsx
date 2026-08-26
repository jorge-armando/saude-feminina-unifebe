import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { ensureNotificationSchedulingAvailable } from "../services/reminders";

export default function NotificationPermissionScreen() {
  const [submitting, setSubmitting] = useState(false);

  const continueToApp = () => {
    router.replace("/user/home");
  };

  const handleEnable = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      if (Platform.OS !== "web") {
        await ensureNotificationSchedulingAvailable();
      }
    } catch {
      // Se a permissão não puder ser confirmada agora, a pessoa ainda pode
      // ativá-la depois em Lembretes ou nos ajustes do aparelho.
    } finally {
      setSubmitting(false);
      continueToApp();
    }
  };

  return (
    <LinearGradient
      colors={["#ffe4e6", "#fce7f3", "#f3e8ff"]}
      style={styles.container}
    >
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <View style={styles.content}>
        <Animated.View entering={ZoomIn.delay(150)} style={styles.iconWrapper}>
          <LinearGradient colors={["#fb7185", "#ec4899"]} style={styles.icon}>
            <Bell size={42} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(250)} style={styles.title}>
          Não perca seus lembretes
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(350)} style={styles.subtitle}>
          Ative as notificações para receber avisos de consultas, previsões do
          seu ciclo e novos conteúdos.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(450)} style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={submitting}
            onPress={() => void handleEnable()}
            accessibilityRole="button"
            accessibilityLabel="Ativar notificações"
            accessibilityState={{ busy: submitting }}
            style={[styles.buttonContainer, submitting && styles.buttonDisabled]}
          >
            <LinearGradient
              colors={["#f43f5e", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Ativar notificações</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={submitting}
            onPress={continueToApp}
            accessibilityRole="button"
            accessibilityLabel="Agora não"
            style={styles.skipButton}
          >
            <Text style={styles.skipButtonText}>Agora não</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(900)} style={styles.footerText}>
          Você pode mudar isso depois em Lembretes ✨
        </Animated.Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    zIndex: 2,
  },

  blobTop: {
    position: "absolute",
    top: -120,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(192,132,252,0.25)",
  },

  blobBottom: {
    position: "absolute",
    bottom: -120,
    right: -120,
    width: 300,
    height: 300,
    borderRadius: 999,
    backgroundColor: "rgba(244,114,182,0.25)",
  },

  iconWrapper: {
    alignItems: "center",
    marginBottom: 32,
  },

  icon: {
    width: 96,
    height: 96,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    color: "#111827",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    color: "#4b5563",
    marginBottom: 40,
  },

  actions: {
    gap: 16,
  },

  buttonContainer: {
    borderRadius: 999,
    overflow: "hidden",
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  button: {
    paddingVertical: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
  },

  skipButtonText: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },

  footerText: {
    marginTop: 40,
    textAlign: "center",
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
});
