import { router, Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === "web") return;

    let isMounted = true;
    const openNotificationResponse = (
      response: Notifications.NotificationResponse,
    ) => {
        const data = response.notification.request.content.data;
        if (data.type === "appointment-reminder") {
          router.push("/user/reminders");
        }
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(
      openNotificationResponse,
    );

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (isMounted && response) {
        openNotificationResponse(response);
        Notifications.clearLastNotificationResponse();
      }
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
