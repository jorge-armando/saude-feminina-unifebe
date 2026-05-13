import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigationState } from "../../hooks/useNavigationState";

export default function ContentPage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("Todos");

  useNavigationState('/user/content');

  const filters = ["Todos", "Ciclo", "Saúde", "Alimentação"];

  const articles = [
    {
      title: "O que é a fase lútea e como ela afeta você",
      time: "5 min",
      category: "Ciclo",
      tag: "Hormônios",
      icon: "bookmark-outline",
    },
    {
      title: "Alimentos que ajudam com a TPM",
      time: "6 min",
      category: "Alimentação",
      tag: "TPM",
      icon: "bookmark",
    },
    {
      title: "Yoga para aliviar cólicas menstruais",
      time: "4 min",
      category: "Exercício",
      tag: "Bem-estar",
      icon: "bookmark-outline",
    },
    {
      title: "Como identificar a ovulação",
      time: "7 min",
      category: "Ciclo",
      tag: "Fertilidade",
      icon: "bookmark-outline",
    },
    {
      title: "Lidando com mudanças de humor no ciclo",
      time: "5 min",
      category: "Emocional",
      tag: "TPM",
      icon: "bookmark",
    },
    {
      title: "Suplementos importantes para a saúde feminina",
      time: "8 min",
      category: "Saúde",
      tag: "Nutrição",
      icon: "bookmark-outline",
    },
    {
      title: "Exercícios para cada fase do ciclo",
      time: "10 min",
      category: "Exercício",
      tag: "Ciclo",
      icon: "bookmark-outline",
    },
    {
      title: "Chás e remédios naturais para cólicas",
      time: "4 min",
      category: "Bem-estar",
      tag: "Natural",
      icon: "bookmark-outline",
    },
  ];

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

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Em Destaque ✨</Text>
        </View>

        <TouchableOpacity
          onPress={() => router.push("/user/content-detail" as any)}
        >
          <LinearGradient
            colors={["#a855f7", "#ec4899", "#fb7185"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.featuredCard}
          >
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>Destaque da Semana</Text>
            </View>

            <Text style={styles.featuredTitle}>
              Entendendo as fases do seu ciclo menstrual
            </Text>

            <Text style={styles.featuredDescription}>
              Aprenda como cada fase do ciclo afeta seu corpo, mente e energia
            </Text>

            <View style={styles.readTimeRow}>
              <Ionicons name="time-outline" size={14} color="#fff" />
              <Text style={styles.readTime}>8 min de leitura</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Todos os Artigos 📚</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>Ver salvos</Text>
          </TouchableOpacity>
        </View>

        {articles.map((article, index) => (
          <TouchableOpacity
            key={index}
            style={styles.articleCard}
            onPress={() => {
              if (index === 0) {
                router.push("/user/content-detail" as any);
              }
            }}
          >
            <View style={styles.articleContent}>
              <View style={styles.articleInfo}>
                <Text style={styles.articleTitle}>{article.title}</Text>

                <View style={styles.articleMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={13} color="#9ca3af" />
                    <Text style={styles.metaText}>{article.time}</Text>
                  </View>

                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{article.category}</Text>
                  </View>

                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{article.tag}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.articleActions}>
                <TouchableOpacity style={styles.saveIcon}>
                  <Ionicons
                    name={article.icon as any}
                    size={18}
                    color="#ec4899"
                  />
                </TouchableOpacity>

                <View style={styles.arrowButton}>
                  <Ionicons name="chevron-forward" size={18} color="#ec4899" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.loadMoreButton}>
          <Text style={styles.loadMoreText}>Carregar mais artigos</Text>
        </TouchableOpacity>
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
    paddingBottom: 110,
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
});
