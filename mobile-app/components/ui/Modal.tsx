import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import {
  Pressable,
  Modal as RNModal,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayPress?: boolean;
  wrapperStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  overlayStyle?: ViewStyle;
  animationDuration?: number;
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  footer,
  showCloseButton = true,
  closeOnOverlayPress = true,
  wrapperStyle,
  contentStyle,
  titleStyle,
  overlayStyle,
  animationDuration = 300,
}: ModalProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, {
        duration: animationDuration,
        easing: Easing.out(Easing.ease),
      });
      scale.value = withTiming(1, {
        duration: animationDuration,
        easing: Easing.out(Easing.back(1.1)),
      });
    } else {
      opacity.value = withTiming(0, {
        duration: animationDuration * 0.7,
        easing: Easing.in(Easing.ease),
      });
      scale.value = withTiming(0.9, {
        duration: animationDuration * 0.7,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [visible, animationDuration]);

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[styles.overlay, overlayStyle, overlayAnimatedStyle]}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={closeOnOverlayPress ? onClose : undefined}
          />
        </Animated.View>
        <Animated.View
          style={[styles.wrapper, wrapperStyle, contentAnimatedStyle]}
        >
          <View style={styles.header}>
            {title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
            {showCloseButton && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.content, contentStyle]}
          >
            {children}
          </ScrollView>

          {footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  wrapper: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 0,
    width: "90%",
    maxWidth: 500,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    padding: 24,
  },
  scrollView: {
    flexGrow: 0,
    flexShrink: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  title: {
    color: "#101828",
    fontFamily: "Nunito",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 28,
  },
});
