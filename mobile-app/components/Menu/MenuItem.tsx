import { LinearGradient } from "expo-linear-gradient";
import { Href, Link, usePathname } from "expo-router";
import { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface MenuItemProps {
  href: Href;
  text: string;
  icon: LucideIcon;
  variant?: "default" | "big";
}

export function MenuItem(props: MenuItemProps) {
  const { variant = "default" } = props;
  const Icon = props.icon;
  const pathname = usePathname();

  const isBig = variant === "big";
  const isActive = pathname === props.href;

  return (
    <Link href={props.href} replace asChild>
      <Pressable style={isBig ? styles.containerBig : styles.container}>
        {isActive || isBig ? (
          <LinearGradient
            colors={isActive ? ["#FF2056", "#F6339A"] : ["#FF637E", "#FB64B6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={isBig ? styles.iconWrapperBig : styles.iconWrapper}
          >
            <Icon size={isBig ? 28 : 24} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={isBig ? styles.iconWrapperBig : styles.iconWrapper}>
            <Icon size={isBig ? 28 : 24} color="#6A7282" />
          </View>
        )}
        <Text
          style={[
            isBig ? styles.textBig : styles.text,
            isActive && { color: "#EC003F" },
          ]}
        >
          {props.text}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexGrow: 0,
    width: 68,
  },
  containerBig: {
    alignItems: "center",
    flexGrow: 0,
    width: 68,
  },
  iconWrapper: {
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapperBig: {
    height: 68,
    width: 68,
    borderRadius: 34,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: -22,
  },
  text: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "500",
    color: "#6A7282",
    textAlign: "center",
  },
  textBig: {
    marginTop: "auto",
    fontSize: 12,
    fontWeight: "500",
    color: "#6A7282",
    textAlign: "center",
  },
});
