import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useContent } from "../../hooks/useContents";
import { LinearGradient } from "expo-linear-gradient";
import { SafeMarkdown } from "../../components/content/SafeMarkdown";

export default function ContentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const rawContentId = Array.isArray(id) ? id[0] : id;
  const contentId =
    typeof rawContentId === "string" && /^\d+$/.test(rawContentId.trim())
      ? Number(rawContentId)
      : Number.NaN;
  const hasValidContentId =
    Number.isSafeInteger(contentId) && contentId > 0;
  const { data, isLoading, error, refetch } = useContent(
    hasValidContentId ? contentId : 0
  );

  const content = data?.data;

  // Pega a primeira tag como categoria
  const category = content?.tags.split(",")[0]?.trim() || "Saúde";

  // Animated value para o scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/user/home");
  };

  const openContents = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace("/user/content");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fce7f3", "#fdf2f8", "#f3e8ff"]}
        style={styles.gradient}
      >
        <Animated.View style={styles.header}>
          <TouchableOpacity
            accessibilityLabel="Voltar"
            accessibilityHint="Voltar para a tela anterior"
            accessibilityRole="button"
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Animated.Text style={styles.headerTitle}>Conteúdo</Animated.Text>

          <View style={styles.headerSpacer} />
        </Animated.View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
        >
          {!hasValidContentId ? (
            <View accessibilityRole="alert" style={styles.errorContainer}>
              <Ionicons name="link-outline" size={58} color="#dc2626" />
              <Text style={styles.errorText}>Link de conteúdo inválido</Text>
              <Text style={styles.errorDescription}>
                Este link não informa qual conteúdo deve ser aberto.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.contentsButton}
                onPress={openContents}
              >
                <Text style={styles.contentsButtonText}>
                  Ver todos os conteúdos
                </Text>
              </TouchableOpacity>
            </View>
          ) : isLoading ? (
            <View accessibilityLiveRegion="polite" style={styles.loadingContainer}>
              <ActivityIndicator
                accessibilityLabel="Carregando conteúdo"
                size="large"
                color="#ec4899"
              />
              <Text style={styles.loadingText}>Carregando conteúdo...</Text>
            </View>
          ) : error ? (
            <View accessibilityRole="alert" style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={64} color="#ef4444" />
              <Text style={styles.errorText}>Erro ao carregar conteúdo</Text>
              <Text style={styles.errorDescription}>
                Verifique sua conexão ou volte para a lista de conteúdos.
              </Text>
              <View style={styles.errorActions}>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.retryButton}
                  onPress={() => void refetch()}
                >
                  <Text style={styles.retryButtonText}>Tentar novamente</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  style={styles.secondaryContentsButton}
                  onPress={openContents}
                >
                  <Text style={styles.secondaryContentsButtonText}>
                    Ver conteúdos
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : content ? (
            <View style={styles.content}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>

              <Text accessibilityRole="header" style={styles.title}>
                {content.title}
              </Text>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color="#ec4899" />
                <Text style={styles.infoText}>
                  {content.reading_time} min de leitura
                </Text>
              </View>

              <View style={styles.markdownContainer}>
                <SafeMarkdown>{content.content}</SafeMarkdown>
              </View>
            </View>
          ) : (
            <View accessibilityRole="alert" style={styles.errorContainer}>
              <Ionicons name="document-outline" size={58} color="#9ca3af" />
              <Text style={styles.errorText}>Conteúdo não encontrado</Text>
              <Text style={styles.errorDescription}>
                O conteúdo pode ter sido removido ou estar indisponível.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                style={styles.contentsButton}
                onPress={openContents}
              >
                <Text style={styles.contentsButtonText}>
                  Ver todos os conteúdos
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 16,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    backgroundColor: "#fff",
    elevation: 6,
    zIndex: 10,
    minHeight: 80,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ec4899",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
  },
  headerSpacer: {
    width: 44,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    alignSelf: "center",
    backgroundColor: "#fff",
    maxWidth: 760,
    padding: 24,
    minHeight: 600,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    width: "100%",
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fce7f3",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 14,
  },
  categoryText: {
    color: "#ec4899",
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 12,
    lineHeight: 34,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "600",
  },
  markdownContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 12,
  },
  errorContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 100,
  },
  errorText: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },
  errorDescription: {
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 22,
    marginTop: 8,
    maxWidth: 360,
    textAlign: "center",
  },
  errorActions: {
    gap: 10,
    maxWidth: 320,
    width: "100%",
  },
  retryButton: {
    alignItems: "center",
    backgroundColor: "#ec4899",
    borderRadius: 18,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  contentsButton: {
    alignItems: "center",
    backgroundColor: "#ec4899",
    borderRadius: 18,
    justifyContent: "center",
    maxWidth: 320,
    minHeight: 48,
    paddingHorizontal: 22,
    width: "100%",
  },
  contentsButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  secondaryContentsButton: {
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderColor: "#f9a8d4",
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 22,
  },
  secondaryContentsButtonText: {
    color: "#be185d",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
});
