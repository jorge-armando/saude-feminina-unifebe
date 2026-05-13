import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";

export default function Index() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkWelcome() {
      const hasCompletedWelcome = await AsyncStorage.getItem(
        "hasCompletedWelcome",
      );

      if (hasCompletedWelcome === "true") {
        // Verificar se há uma tela salva para restaurar
        const savedScreen = await AsyncStorage.getItem("currentScreen");
        if (savedScreen) {
          router.replace(savedScreen as any);
        } else {
          router.replace("/user/home");
        }
        return;
      }

      setLoading(false);
    }

    checkWelcome();
  }, []);

  async function handleSubmit() {
    if (!name.trim()) return;

    await AsyncStorage.setItem("userName", name.trim());
    await AsyncStorage.setItem("hasCompletedWelcome", "true");

    router.replace("/user/home");
  }

  if (loading) {
    return (
      <LinearGradient
        colors={["#ffe4e6", "#fce7f3", "#f3e8ff"]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color="#ec4899" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#ffe4e6", "#fce7f3", "#f3e8ff"]}
      style={styles.container}
    >
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.content}
      >
        <Animated.View entering={ZoomIn.delay(200)} style={styles.logoWrapper}>
          <LinearGradient colors={["#fb7185", "#ec4899"]} style={styles.logo}>
            <Sparkles size={42} color="#fff" />
          </LinearGradient>
        </Animated.View>

        <Animated.Text entering={FadeInDown.delay(300)} style={styles.title}>
          Bem-vinda! 💕
        </Animated.Text>

        <Animated.Text entering={FadeInDown.delay(400)} style={styles.subtitle}>
          Como devo chamá-la?
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.form}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Digite seu nome"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            autoFocus
          />

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!name.trim()}
            onPress={handleSubmit}
            style={[
              styles.buttonContainer,
              !name.trim() && styles.buttonDisabled,
            ]}
          >
            <LinearGradient
              colors={["#f43f5e", "#ec4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Continuar</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(1000)} style={styles.footerText}>
          Estamos felizes em ter você aqui ✨
        </Animated.Text>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
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

  logoWrapper: {
    alignItems: "center",
    marginBottom: 32,
  },

  logo: {
    width: 96,
    height: 96,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },

  title: {
    fontSize: 36,
    fontWeight: "bold",
    textAlign: "center",
    color: "#111827",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 18,
    textAlign: "center",
    color: "#4b5563",
    marginBottom: 40,
  },

  form: {
    gap: 20,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 2,
    borderColor: "#fbcfe8",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 24,
    fontSize: 18,
    color: "#111827",
    textAlign: "center",
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

  footerText: {
    marginTop: 40,
    textAlign: "center",
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
  },
});
