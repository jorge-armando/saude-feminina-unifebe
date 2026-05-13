import { Bell, BookOpen, Calendar, Home, User } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MenuItem } from "./MenuItem";

export function Menu() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 16);

  return (
    <View style={[styles.root, { paddingBottom }]}>
      <MenuItem href="/user/calendar" text="Calendário" icon={Calendar} />
      <MenuItem href="/user/content" text="Conteúdos" icon={BookOpen} />
      <MenuItem href="/user/home" text="Início" icon={Home} variant="big" />
      <MenuItem href="/user/reminders" text="Lembretes" icon={Bell} />
      <MenuItem href="/user/profile" text="Perfil" icon={User} />
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
    justifyContent: "space-between",
    paddingLeft: 16,
    paddingRight: 16,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  link: {
    flex: 1,
    padding: 16,
    textAlign: "center",
    color: "#333",
  },
});
