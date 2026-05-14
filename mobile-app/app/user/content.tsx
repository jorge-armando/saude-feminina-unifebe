import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigationState } from "../../hooks/useNavigationState";
import { useContents } from "../../hooks/useContents";

export default function ContentPage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error, refetch } = useContents();
  useNavigationState('/user/content');

  const filters = ["Todos", "Ciclo", "Saúde", "Bem-estar", "Prevenção"];

  // Filtra conteúdos baseado no filtro selecionado e busca
  const filteredContents = data?.data?.filter((content) => {
    const matchesSearch =
      searchQuery.length === 0 ||
      content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.tags.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === "Todos" ||
      content.tags.toLowerCase().includes(selectedFilter.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  // Pega o primeiro conteúdo como destaque
  const featuredContent = filteredContents?.[0];

  // Remove o destaque da lista de artigos
  const articles = filteredContents?.slice(1) || [];

  // Função para extrair a primeira tag
  const getFirstTag = (tags: string) => {
    return tags.split(",")[0] || "Saúde";
  };

  return (
    <LinearGradient
      colors={["#fce7f3", "#fdf2f8", "#f3e8ff"]}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Conteúdos 📚</Text>
          <Text style={styles.subtitle}>Aprenda sobre saúde feminina</Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar artigos..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter === "Todos" ? "✨ " : ""}
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ec4899" />
            <Text style={styles.loadingText}>Carregando conteúdos...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color="#ef4444" />
            <Text style={styles.errorText}>Erro ao carregar conteúdos</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
              <Text style={styles.retryButtonText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {featuredContent && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Em Destaque ✨</Text>
                </View>

                <TouchableOpacity
                  onPress={() =>
                    router.push(`/user/content-detail?id=${featuredContent.id}` as any)
                  }
                >
                  <LinearGradient
                    colors={["#a855f7", "#ec4899", "#fb7185"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featuredCard}
                  >
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeText}>
                        Destaque da Semana
                      </Text>
                    </View>

                    <Text style={styles.featuredTitle}>
                      {featuredContent.title}
                    </Text>

                    <Text
                      style={styles.featuredDescription}
                      numberOfLines={2}
                    >
                      {featuredContent.content.substring(0, 100)}...
                    </Text>

                    <View style={styles.readTimeRow}>
                      <Ionicons name="time-outline" size={14} color="#fff" />
                      <Text style={styles.readTime}>
                        {featuredContent.reading_time} min de leitura
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {filteredContents && filteredContents.length > 0
                  ? `Todos os Artigos 📚 (${filteredContents.length})`
                  : "Nenhum artigo encontrado"}
              </Text>
            </View>

            {articles.map((article) => (
              <TouchableOpacity
                key={article.id}
                style={styles.articleCard}
                onPress={() =>
                  router.push(`/user/content-detail?id=${article.id}` as any)
                }
              >
                <View style={styles.articleContent}>
                  <View style={styles.articleInfo}>
                    <Text style={styles.articleTitle}>{article.title}</Text>

                    <View style={styles.articleMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons
                          name="time-outline"
                          size={13}
                          color="#9ca3af"
                        />
                        <Text style={styles.metaText}>
                          {article.reading_time} min
                        </Text>
                      </View>

                      {article.tags.split(",").slice(0, 2).map((tag, idx) => (
                        <View key={idx} style={styles.tag}>
                          <Text style={styles.tagText}>{tag.trim()}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={styles.articleActions}>
                    <View style={styles.arrowButton}>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#ec4899"
                      />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {filteredContents && filteredContents.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>
                  Nenhum conteúdo encontrado
                </Text>
                <Text style={styles.emptySubtext}>
                  Tente ajustar seus filtros ou busca
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 55,
    paddingHorizontal: 22,
    paddingBottom: 20,
  },

  header: {
    marginBottom: 18,
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },

  searchBox: {
    height: 46,
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#111827",
  },

  filters: {
    gap: 8,
    paddingBottom: 20,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#fff",
  },

  filterButtonActive: {
    backgroundColor: "#ec4899",
  },

  filterText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
  },

  filterTextActive: {
    color: "#fff",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },

  seeAll: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ec4899",
  },

  featuredCard: {
    borderRadius: 24,
    padding: 22,
    marginBottom: 24,
    minHeight: 170,
    justifyContent: "space-between",
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },

  featuredBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },

  featuredBadgeText: {
    fontSize: 11,
    color: "#fff",
    fontWeight: "700",
  },

  featuredTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },

  featuredDescription: {
    fontSize: 13,
    color: "#fff",
    opacity: 0.9,
    lineHeight: 19,
    marginBottom: 14,
  },

  readTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  readTime: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.95,
  },

  articleCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#ec4899",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  articleContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  articleInfo: {
    flex: 1,
    paddingRight: 10,
  },

  articleTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    lineHeight: 20,
    marginBottom: 10,
  },

  articleMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  metaText: {
    fontSize: 11,
    color: "#9ca3af",
  },

  tag: {
    backgroundColor: "#fce7f3",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },

  tagText: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "600",
  },

  articleActions: {
    alignItems: "center",
    gap: 12,
  },

  saveIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff1f7",
    alignItems: "center",
    justifyContent: "center",
  },

  arrowButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#fff1f7",
    alignItems: "center",
    justifyContent: "center",
  },

  loadMoreButton: {
    backgroundColor: "#fff",
    borderRadius: 18,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
  },

  loadMoreText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#374151",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
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
    paddingVertical: 60,
  },

  errorText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
    marginBottom: 20,
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

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },

  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
  },

  emptySubtext: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
  },
});
