import { Link } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function Menu() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <Link href="/" replace style={styles.link}>
        Index
      </Link>
      <Link href="/calendar" replace style={styles.link}>
        Calendar
      </Link>
      <Link href="/content" replace style={styles.link}>
        Content
      </Link>
      <Link href="/home" replace style={styles.link}>
        Home
      </Link>
      <Link href="/profile" replace style={styles.link}>
        Profile
      </Link>
      <Link href="/reminders" replace style={styles.link}>
        Reminders
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  link: {
    flex: 1,
    padding: 16,
    textAlign: "center",
    color: "#333",
  },
});
