import { Text, View, Button } from "react-native";
import { router } from "expo-router";

export default function Welcome() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>Content</Text>

      <Button
        title="Voltar"
        onPress={() => router.back()}
      />
    </View>
  );
}