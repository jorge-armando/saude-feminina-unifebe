import { Bell, BookOpen, Calendar, Home, User } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MenuItem } from "./MenuItem";

export function Menu() {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.root, { paddingBottom }]}>
      <View accessibilityRole="tablist" style={styles.navigation}>
        <MenuItem href="/user/calendar" text="Calendário" icon={Calendar} />
        <MenuItem
          activePaths={["/user/content", "/user/content-detail"]}
          href="/user/content"
          text="Conteúdos"
          icon={BookOpen}
        />
        <MenuItem href="/user/home" text="Início" icon={Home} variant="big" />
        <MenuItem href="/user/reminders" text="Lembretes" icon={Bell} />
        <MenuItem href="/user/profile" text="Perfil" icon={User} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: "#fff",
    borderTopColor: "#f3f4f6",
    borderTopWidth: 1,
    paddingHorizontal: 8,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 10,
  },
  navigation: {
    alignSelf: "center",
    flexDirection: "row",
    maxWidth: 680,
    overflow: "visible",
    width: "100%",
  },
});
