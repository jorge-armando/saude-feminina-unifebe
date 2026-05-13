import { View, Text, StyleSheet } from "react-native";
import { useNavigationState } from "../../hooks/useNavigationState";

export default function AccountPage() {
  useNavigationState('/user/account');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Minha Conta</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff5fb",
  },
  text: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
});