import { LinearGradient } from "expo-linear-gradient";
import { router, usePathname } from "expo-router";
import { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

type MenuHref =
  | "/user/calendar"
  | "/user/content"
  | "/user/home"
  | "/user/reminders"
  | "/user/profile";

interface MenuItemProps {
  href: MenuHref;
  text: string;
  icon: LucideIcon;
  variant?: "default" | "big";
  activePaths?: readonly string[];
}

export function MenuItem(props: MenuItemProps) {
  const { variant = "default" } = props;
  const Icon = props.icon;
  const pathname = usePathname();

  const isBig = variant === "big";
  const isActive = (props.activePaths ?? [props.href]).includes(pathname);

  const handlePress = () => {
    if (pathname === props.href) {
      return;
    }

    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace(props.href);
  };

  return (
    <Pressable
      accessibilityLabel={props.text}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        isBig && styles.containerBig,
        pressed && styles.containerPressed,
      ]}
    >
      {isActive ? (
        <LinearGradient
          colors={["#FF2056", "#F6339A"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconWrapper, isBig && styles.iconWrapperBig]}
        >
          <Icon size={isBig ? 26 : 22} color="#fff" />
        </LinearGradient>
      ) : (
        <View style={[styles.iconWrapper, isBig && styles.iconWrapperBig]}>
          <Icon size={isBig ? 26 : 22} color="#6A7282" />
        </View>
      )}
      <Text
        style={[
          styles.text,
          isBig && styles.textBig,
          isActive && styles.textActive,
        ]}
      >
        {props.text}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-start",
    minHeight: 64,
    minWidth: 44,
    paddingHorizontal: 2,
  },
  containerBig: {
    minHeight: 64,
  },
  containerPressed: {
    opacity: 0.72,
  },
  iconWrapper: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapperBig: {
    height: 56,
    width: 56,
    borderRadius: 28,
    transform: [{ translateY: -20 }],
  },
  text: {
    color: "#6A7282",
    flexShrink: 1,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
    marginTop: 4,
    minHeight: 14,
    paddingHorizontal: 1,
    textAlign: "center",
  },
  textActive: {
    color: "#C70036",
    fontWeight: "800",
  },
  textBig: {
    marginTop: -8,
  },
});
