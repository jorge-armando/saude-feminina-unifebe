import Menu from "@/components/Menu";
import { Redirect, Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { loadLocalUserProfile } from "../../services/userProfile";

export default function RootLayout() {
  const [accessState, setAccessState] = useState<
    "loading" | "allowed" | "denied"
  >("loading");

  useEffect(() => {
    let isMounted = true;

    async function validateWelcome() {
      try {
        const profile = await loadLocalUserProfile();

        if (isMounted) {
          setAccessState(profile ? "allowed" : "denied");
        }
      } catch {
        if (isMounted) {
          setAccessState("denied");
        }
      }
    }

    void validateWelcome();

    return () => {
      isMounted = false;
    };
  }, []);

  if (accessState === "loading") {
    return (
      <View
        accessibilityLiveRegion="polite"
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          accessibilityLabel="Carregando seu perfil"
          size="large"
          color="#ec4899"
        />
        <Text style={styles.loadingText}>Carregando seu perfil...</Text>
      </View>
    );
  }

  if (accessState === "denied") {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.content}>
        <Stack screenOptions={{ headerShown: false }} />
      </View>
      <Menu />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: "center",
    backgroundColor: "#fdf2f8",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  loadingText: {
    color: "#6b7280",
    fontSize: 14,
    marginTop: 12,
  },
});
