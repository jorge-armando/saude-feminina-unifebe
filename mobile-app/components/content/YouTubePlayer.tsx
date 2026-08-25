import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import {
  toCanonicalYouTubeUrl,
  toYouTubeEmbedUrl,
} from "../../services/contentMedia";

interface YouTubePlayerProps {
  title?: string;
  url: string;
}

// YouTube exige que players carregados diretamente em WebViews identifiquem o
// aplicativo pelo Referer. O valor usa o package/bundle id estável do app.
const YOUTUBE_APP_REFERER = "https://com.jorge078.saudefeminina";

async function openYouTube(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    await WebBrowser.openBrowserAsync(url);
  }
}

export function YouTubePlayer({ title = "Vídeo do conteúdo", url }: YouTubePlayerProps) {
  const canonicalUrl = useMemo(() => toCanonicalYouTubeUrl(url), [url]);
  const embedUrl = useMemo(() => toYouTubeEmbedUrl(url), [url]);
  const [playerFailed, setPlayerFailed] = useState(false);

  useEffect(() => {
    setPlayerFailed(false);
  }, [embedUrl]);

  if (!canonicalUrl || !embedUrl) {
    return null;
  }

  const canEmbed = Platform.OS !== "web" && !playerFailed;

  return (
    <View style={styles.container}>
      {canEmbed ? (
        <View style={styles.playerFrame}>
          <WebView
            accessibilityLabel={title}
            allowsFullscreenVideo
            allowsInlineMediaPlayback
            domStorageEnabled
            javaScriptEnabled
            mediaPlaybackRequiresUserAction
            originWhitelist={["https://www.youtube-nocookie.com"]}
            source={{
              uri: embedUrl,
              headers: { Referer: YOUTUBE_APP_REFERER },
            }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.loading}>
                <ActivityIndicator color="#ec4899" />
              </View>
            )}
            onError={() => setPlayerFailed(true)}
            onHttpError={() => setPlayerFailed(true)}
            onShouldStartLoadWithRequest={(request) => {
              if (
                request.url === "about:blank" ||
                request.url.startsWith("https://www.youtube-nocookie.com/embed/")
              ) {
                return true;
              }

              void openYouTube(canonicalUrl);
              return false;
            }}
            style={styles.webView}
          />
        </View>
      ) : (
        <View style={styles.fallback}>
          <Ionicons name="logo-youtube" size={34} color="#dc2626" />
          <Text style={styles.fallbackText}>
            {Platform.OS === "web"
              ? "Assista a este vídeo no YouTube."
              : "O player não pôde ser carregado."}
          </Text>
        </View>
      )}

      <TouchableOpacity
        accessibilityHint="Abre o aplicativo ou site do YouTube"
        accessibilityRole="link"
        style={styles.openButton}
        onPress={() => void openYouTube(canonicalUrl)}
      >
        <Ionicons name="logo-youtube" size={18} color="#ffffff" />
        <Text style={styles.openButtonText}>Abrir no YouTube</Text>
        <Ionicons name="open-outline" size={16} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderColor: "#fecdd3",
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 14,
    overflow: "hidden",
  },
  playerFrame: {
    aspectRatio: 16 / 9,
    backgroundColor: "#111827",
    minHeight: 200,
    width: "100%",
  },
  webView: {
    backgroundColor: "#111827",
    flex: 1,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "#111827",
    justifyContent: "center",
  },
  fallback: {
    alignItems: "center",
    backgroundColor: "#fff1f2",
    flexDirection: "row",
    gap: 12,
    minHeight: 92,
    padding: 18,
  },
  fallbackText: {
    color: "#7f1d1d",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  openButton: {
    alignItems: "center",
    backgroundColor: "#dc2626",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: 16,
  },
  openButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },
});
