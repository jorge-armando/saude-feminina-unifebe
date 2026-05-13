import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { useEffect } from "react";

export function useNavigationState(screenName: string) {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      AsyncStorage.setItem("currentScreen", screenName);
    }
  }, [isFocused, screenName]);
}