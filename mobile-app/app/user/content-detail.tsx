import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const conteúdos = [
  {
    id: "1",
    titulo: "Ciclo menstrual",
    categoria: "Saúde feminina",
    tempo: "5 min de leitura",
    imagem:
      "https://images.unsplash.com/photo-1516585427167-9f4af9627e6c?q=80&w=1200&auto=format&fit=crop",
    texto:
      "O ciclo menstrual é um processo natural do corpo feminino. Ele envolve mudanças hormonais que preparam o corpo para uma possível gravidez. A duração média do ciclo é de 28 dias, mas pode variar de pessoa para pessoa.",
  },
  {
    id: "2",
    titulo: "Saúde íntima",
    categoria: "Cuidados",
    tempo: "4 min de leitura",
    imagem:
      "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?q=80&w=1200&auto=format&fit=crop",
    texto:
      "A saúde íntima envolve cuidados diários com higiene, prevenção de infecções e atenção aos sinais do corpo. Consultas regulares com profissionais da saúde são importantes para prevenção e orientação correta.",
  },
  {
    id: "3",
    titulo: "Prevenção e exames",
    categoria: "Prevenção",
    tempo: "6 min de leitura",
    imagem:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=1200&auto=format&fit=crop",
    texto:
      "A prevenção é essencial para manter a saúde em dia. Exames periódicos ajudam a identificar alterações precocemente e aumentam as chances de tratamento adequado quando necessário.",
  },
];

export default function ContentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const conteudo =
    conteúdos.find((item) => item.id === String(id)) || conteúdos[0];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: conteudo.imagem }} style={styles.image} />

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{conteudo.categoria}</Text>
          </View>

          <Text style={styles.title}>{conteudo.titulo}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={18} color="#8b5f7a" />
            <Text style={styles.infoText}>{conteudo.tempo}</Text>
          </View>

          <Text style={styles.paragraph}>{conteudo.texto}</Text>

          <Text style={styles.sectionTitle}>Por que isso é importante?</Text>

          <Text style={styles.paragraph}>
            Entender esse assunto ajuda a mulher a reconhecer melhor o próprio
            corpo, identificar sinais de alerta e buscar orientação profissional
            quando necessário.
          </Text>

          <Text style={styles.sectionTitle}>Cuidados recomendados</Text>

          <View style={styles.card}>
            <Text style={styles.cardText}>• Manter acompanhamento médico.</Text>
            <Text style={styles.cardText}>• Observar alterações no corpo.</Text>
            <Text style={styles.cardText}>
              • Evitar automedicação sem orientação.
            </Text>
            <Text style={styles.cardText}>
              • Buscar informação em fontes confiáveis.
            </Text>
          </View>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Marcar como lido</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff7fb",
  },
  imageContainer: {
    width: "100%",
    height: 260,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  backButton: {
    position: "absolute",
    top: 48,
    left: 20,
    backgroundColor: "#ffffff",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  content: {
    marginTop: -28,
    backgroundColor: "#fff7fb",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f4d7e8",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 14,
  },
  categoryText: {
    color: "#8b2f61",
    fontSize: 13,
    fontWeight: "700",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#30242c",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#8b5f7a",
  },
  paragraph: {
    fontSize: 16,
    color: "#4f3f49",
    lineHeight: 25,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#30242c",
    marginBottom: 12,
    marginTop: 6,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    marginBottom: 26,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  cardText: {
    fontSize: 15,
    color: "#4f3f49",
    marginBottom: 8,
    lineHeight: 22,
  },
  button: {
    backgroundColor: "#c64f8a",
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
});