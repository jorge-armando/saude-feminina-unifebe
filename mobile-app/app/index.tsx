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
import {
  createLocalUserProfile,
  loadLocalUserProfile,
  MAX_USER_NAME_LENGTH,
} from "../services/userProfile";

export default function Index() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkExistingUser() {
      try {
        const profile = await loadLocalUserProfile();

        if (profile) {
          router.replace("/user/home");
          return;
        }
      } catch (error) {
        console.error("Error checking existing user:", error);
        setError(
          "Não foi possível verificar os dados deste aparelho. Tente novamente.",
        );
      } finally {
        setLoading(false);
      }
    }

    checkExistingUser();
  }, []);

  if (loading) {
    return (
      <LinearGradient
        colors={["#ffe4e6", "#fce7f3", "#f3e8ff"]}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
        </View>
      </LinearGradient>
    );
  }

  async function handleSubmit() {
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await createLocalUserProfile(name);
      router.replace("/user/home");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Não foi possível salvar seu nome. Tente novamente.",
      );
    } finally {
      setSubmitting(false);
    }
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
            onChangeText={(value) => {
              setName(value);
              setError(null);
            }}
            placeholder="Digite seu nome"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={MAX_USER_NAME_LENGTH}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Seu nome"
          />

          {error ? (
            <Text accessibilityRole="alert" style={styles.errorText}>
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.8}
            disabled={!name.trim() || submitting}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel="Continuar para o aplicativo"
            accessibilityState={{ disabled: !name.trim() || submitting, busy: submitting }}
            style={[
              styles.buttonContainer,
              (!name.trim() || submitting) && styles.buttonDisabled,
            ]}
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
                <Text style={styles.buttonText}>Continuar</Text>
              )}
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

  errorText: {
    color: "#b91c1c",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
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
