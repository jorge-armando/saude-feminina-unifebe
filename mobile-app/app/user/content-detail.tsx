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
import Markdown from "react-native-markdown-renderer";
import { useContent } from "../../hooks/useContents";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigationState } from "@/hooks/useNavigationState";

export default function ContentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const contentId = Number(id);
  const { data, isLoading, error, refetch } = useContent(contentId);

  const content = data?.data;

  // Pega a primeira tag como categoria
  const category = content?.tags.split(",")[0]?.trim() || "Saúde";

  // Animated value para o scroll
  const scrollY = useRef(new Animated.Value(0)).current;

  // Calcula a opacidade do título baseado no scroll
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Calcula a altura do header baseado no scroll
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [90, 66],
    extrapolate: "clamp",
  });

  // Calcula a elevação/shadow do header
  const headerElevation = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 8],
    extrapolate: "clamp",
  });

  // Calcula a opacidade do background do header
  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [0, 0.95],
    extrapolate: "clamp",
  });

  useNavigationState('/user/content-detail');

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#fce7f3", "#fdf2f8", "#f3e8ff"]}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.header,
            {
              height: headerHeight,
              elevation: headerElevation,
              shadowOpacity: headerElevation.interpolate({
                inputRange: [0, 8],
                outputRange: [0, 0.15],
              }),
            },
          ]}
        >
          <Animated.View
            style={[
              styles.headerBackground,
              { opacity: headerBackgroundOpacity },
            ]}
          />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <Animated.Text style={[styles.headerTitle, { opacity: titleOpacity }]}>
            Conteúdo
          </Animated.Text>

          <View style={styles.headerSpacer} />
        </Animated.View>

        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ec4899" />
              <Text style={styles.loadingText}>Carregando conteúdo...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={64} color="#ef4444" />
              <Text style={styles.errorText}>Erro ao carregar conteúdo</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => refetch()}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : content ? (
            <View style={styles.content}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>

              <Text style={styles.title}>{content.title}</Text>

              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color="#ec4899" />
                <Text style={styles.infoText}>
                  {content.reading_time} min de leitura
                </Text>
              </View>

              <View style={styles.markdownContainer}>
                <Markdown style={markdownStyles}>{content.content}</Markdown>
              </View>
            </View>
          ) : null}
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    zIndex: -1,
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
    paddingBottom: 20,
  },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    marginTop: 8,
    minHeight: 600,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: "#ec4899",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 18,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 26,
    color: "#374151",
  },
  heading2: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginTop: 24,
    marginBottom: 12,
  },
  heading3: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 20,
    marginBottom: 10,
  },
  heading4: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 26,
    color: "#374151",
    marginBottom: 14,
  },
  listItem: {
    fontSize: 16,
    lineHeight: 26,
    color: "#374151",
    marginBottom: 8,
  },
  bullet_list: {
    marginBottom: 16,
  },
  ordered_list: {
    marginBottom: 16,
  },
  strong: {
    fontWeight: "700",
    color: "#111827",
  },
  em: {
    fontStyle: "italic",
  },
  blockquote: {
    backgroundColor: "#fef3c7",
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 12,
    borderRadius: 8,
  },
  code_inline: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 14,
    fontFamily: "monospace",
  },
  fence: {
    backgroundColor: "#f3f4f6",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  hr: {
    backgroundColor: "#e5e7eb",
    height: 1,
    marginVertical: 20,
  },
};