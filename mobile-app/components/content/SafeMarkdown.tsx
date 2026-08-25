import { StyleSheet, Text, View } from "react-native";
import { resolveContentAssetUrl } from "../../services/api";
import {
  extractStandaloneYouTubeUrl,
  getYouTubeVideoId,
  parseStandaloneHtmlImage,
  parseStandaloneMarkdownImage,
  toCanonicalYouTubeUrl,
} from "../../services/contentMedia";
import { ContentImage } from "./ContentImage";
import { YouTubePlayer } from "./YouTubePlayer";

interface SafeMarkdownProps {
  children: string;
  youtubeUrl?: string | null;
}

const MAX_ARTICLE_CHARACTERS = 100_000;

function plainInlineText(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

export function SafeMarkdown({ children, youtubeUrl }: SafeMarkdownProps) {
  const wasTruncated = children.length > MAX_ARTICLE_CHARACTERS;
  const lines = children
    .slice(0, MAX_ARTICLE_CHARACTERS)
    .replace(/\r\n?/g, "\n")
    .split("\n");
  const preferredYouTubeUrl = youtubeUrl
    ? toCanonicalYouTubeUrl(youtubeUrl)
    : null;
  const videosInBody = new Set(
    lines
      .map(extractStandaloneYouTubeUrl)
      .filter((url): url is string => !!url)
      .map((url) => getYouTubeVideoId(url))
      .filter((id): id is string => !!id),
  );
  const preferredVideoId = preferredYouTubeUrl
    ? getYouTubeVideoId(preferredYouTubeUrl)
    : null;

  return (
    <View>
      {preferredYouTubeUrl &&
      preferredVideoId &&
      !videosInBody.has(preferredVideoId) ? (
        <YouTubePlayer url={preferredYouTubeUrl} />
      ) : null}

      {lines.map((rawLine, index) => {
        const line = rawLine.trim();
        if (!line) {
          return <View key={`space-${index}`} style={styles.space} />;
        }

        const youtube = extractStandaloneYouTubeUrl(line);
        const youtubeId = youtube ? getYouTubeVideoId(youtube) : null;
        if (youtube && youtubeId) {
          return <YouTubePlayer key={`youtube-${index}`} url={youtube} />;
        }

        const image =
          parseStandaloneMarkdownImage(line) ?? parseStandaloneHtmlImage(line);
        if (image) {
          const resolvedUrl = resolveContentAssetUrl(image.url);

          if (!resolvedUrl) {
            return image.alt ? (
              <Text key={`image-alt-${index}`} style={styles.paragraphBlock}>
                {image.alt}
              </Text>
            ) : null;
          }

          return (
            <ContentImage
              key={`image-${index}`}
              url={resolvedUrl}
              style={styles.image}
              contentFit="cover"
              transition={200}
              alt={image.alt || "Imagem do artigo"}
            />
          );
        }

        const heading = /^(#{1,4})\s+(.+)$/.exec(line);
        if (heading) {
          return (
            <Text
              accessibilityRole="header"
              key={`heading-${index}`}
              style={heading[1].length <= 2 ? styles.headingLarge : styles.headingSmall}
            >
              {plainInlineText(heading[2])}
            </Text>
          );
        }

        const unordered = /^[-+*]\s+(.+)$/.exec(line);
        if (unordered) {
          return (
            <View key={`bullet-${index}`} style={styles.listRow}>
              <Text style={styles.marker}>•</Text>
              <Text style={styles.paragraph}>{plainInlineText(unordered[1])}</Text>
            </View>
          );
        }

        const ordered = /^(\d+)\.\s+(.+)$/.exec(line);
        if (ordered) {
          return (
            <View key={`ordered-${index}`} style={styles.listRow}>
              <Text style={styles.marker}>{ordered[1]}.</Text>
              <Text style={styles.paragraph}>{plainInlineText(ordered[2])}</Text>
            </View>
          );
        }

        if (/^---+$/.test(line)) {
          return <View key={`rule-${index}`} style={styles.rule} />;
        }

        if (line.startsWith(">")) {
          return (
            <View key={`quote-${index}`} style={styles.quote}>
              <Text style={styles.quoteText}>{plainInlineText(line.slice(1))}</Text>
            </View>
          );
        }

        return (
          <Text key={`paragraph-${index}`} style={styles.paragraphBlock}>
            {plainInlineText(line)}
          </Text>
        );
      })}

      {wasTruncated ? (
        <Text accessibilityRole="alert" style={styles.truncated}>
          O artigo excedeu o limite de exibição e foi abreviado por segurança.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  space: { height: 8 },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    marginVertical: 10,
    backgroundColor: "#f3f4f6",
  },
  headingLarge: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 30,
    marginBottom: 8,
    marginTop: 16,
  },
  headingSmall: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    marginBottom: 6,
    marginTop: 12,
  },
  paragraph: {
    color: "#374151",
    flex: 1,
    fontSize: 16,
    lineHeight: 26,
  },
  paragraphBlock: {
    color: "#374151",
    fontSize: 16,
    lineHeight: 26,
    marginBottom: 8,
  },
  listRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginBottom: 8,
  },
  marker: {
    color: "#be185d",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 26,
    marginRight: 10,
    minWidth: 16,
  },
  quote: {
    backgroundColor: "#fef3c7",
    borderLeftColor: "#d97706",
    borderLeftWidth: 4,
    borderRadius: 8,
    marginVertical: 10,
    padding: 14,
  },
  quoteText: {
    color: "#713f12",
    fontSize: 15,
    lineHeight: 23,
  },
  rule: {
    backgroundColor: "#e5e7eb",
    height: 1,
    marginVertical: 18,
  },
  truncated: {
    color: "#92400e",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 18,
  },
});

