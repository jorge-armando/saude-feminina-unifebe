import { Content, resolveContentAssetUrl } from "./api";

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export interface MarkdownImage {
  alt: string;
  url: string;
}

function cleanMarkdownDestination(value: string) {
  let destination = value.trim();
  if (destination.startsWith("<")) {
    const closingBracket = destination.indexOf(">");
    if (closingBracket > 0) {
      destination = destination.slice(1, closingBracket);
    }
  } else {
    // Markdown permite um título opcional depois da URL.
    destination = destination.replace(/\s+(?:"[^"]*"|'[^']*')\s*$/, "");
  }

  return destination.replace(/\\([()])/g, "$1").trim();
}

function findBalancedClosingParenthesis(value: string, openingIndex: number) {
  let depth = 0;

  for (let index = openingIndex; index < value.length; index += 1) {
    if (value[index] === "\\") {
      index += 1;
      continue;
    }

    if (value[index] === "(") {
      depth += 1;
    } else if (value[index] === ")") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

export function parseStandaloneMarkdownImage(value: string): MarkdownImage | null {
  const line = value.trim();
  if (!line.startsWith("![")) {
    return null;
  }

  const separatorIndex = line.indexOf("](", 2);
  if (separatorIndex < 0) {
    return null;
  }

  const openingIndex = separatorIndex + 1;
  const closingIndex = findBalancedClosingParenthesis(line, openingIndex);
  if (closingIndex < 0 || line.slice(closingIndex + 1).trim()) {
    return null;
  }

  const url = cleanMarkdownDestination(
    line.slice(openingIndex + 1, closingIndex),
  );

  return url
    ? {
        alt: line.slice(2, separatorIndex).replace(/\\([\[\]])/g, "$1"),
        url,
      }
    : null;
}

export function parseStandaloneHtmlImage(value: string): MarkdownImage | null {
  const line = value.trim();
  if (!/^<img\b/i.test(line) || !/\/?>$/i.test(line)) {
    return null;
  }

  const source = /\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(line);
  if (!source) {
    return null;
  }

  const alt = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(line);
  return {
    url: source[1] ?? source[2] ?? source[3],
    alt: alt?.[1] ?? alt?.[2] ?? alt?.[3] ?? "",
  };
}

function findFirstMarkdownImage(value: string): MarkdownImage | null {
  let markerIndex = value.indexOf("![");

  while (markerIndex >= 0) {
    const separatorIndex = value.indexOf("](", markerIndex + 2);
    if (separatorIndex < 0) {
      return null;
    }

    const openingIndex = separatorIndex + 1;
    const closingIndex = findBalancedClosingParenthesis(value, openingIndex);
    if (closingIndex >= 0) {
      const url = cleanMarkdownDestination(
        value.slice(openingIndex + 1, closingIndex),
      );
      if (url) {
        return {
          alt: value.slice(markerIndex + 2, separatorIndex),
          url,
        };
      }
    }

    markerIndex = value.indexOf("![", markerIndex + 2);
  }

  return null;
}

export function extractFirstContentImage(markdown: string) {
  const markdownImage = findFirstMarkdownImage(markdown);
  if (markdownImage) {
    return resolveContentAssetUrl(markdownImage.url);
  }

  const htmlImage = /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i.exec(
    markdown,
  );
  const htmlUrl = htmlImage?.[1] ?? htmlImage?.[2] ?? htmlImage?.[3];
  return htmlUrl ? resolveContentAssetUrl(htmlUrl) : null;
}

export function getContentImageUrl(content: Content) {
  return content.image_url ?? extractFirstContentImage(content.content);
}

function sanitizeYouTubeId(value: string | null | undefined) {
  const candidate = value?.trim();
  return candidate && YOUTUBE_ID_PATTERN.test(candidate) ? candidate : null;
}

export function getYouTubeVideoId(value: string): string | null {
  const normalized = value.trim().replace(/&amp;/gi, "&");
  if (!normalized) {
    return null;
  }

  try {
    const parsed = new URL(
      /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`,
    );
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    if (host === "youtu.be") {
      return sanitizeYouTubeId(parsed.pathname.split("/").filter(Boolean)[0]);
    }

    if (
      host !== "youtube.com" &&
      host !== "m.youtube.com" &&
      host !== "music.youtube.com" &&
      host !== "youtube-nocookie.com"
    ) {
      return null;
    }

    if (parsed.pathname === "/watch") {
      return sanitizeYouTubeId(parsed.searchParams.get("v"));
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (["embed", "shorts", "live"].includes(segments[0])) {
      return sanitizeYouTubeId(segments[1]);
    }

    return null;
  } catch {
    return null;
  }
}

export function toCanonicalYouTubeUrl(value: string): string | null {
  const id = getYouTubeVideoId(value);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function toYouTubeEmbedUrl(value: string): string | null {
  const id = getYouTubeVideoId(value);
  return id
    ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`
    : null;
}

function extractMarkdownLinkDestination(value: string) {
  const line = value.trim();
  if (!line.startsWith("[") || line.startsWith("![")) {
    return null;
  }

  const separatorIndex = line.indexOf("](");
  if (separatorIndex < 1) {
    return null;
  }

  const openingIndex = separatorIndex + 1;
  const closingIndex = findBalancedClosingParenthesis(line, openingIndex);
  if (closingIndex < 0 || line.slice(closingIndex + 1).trim()) {
    return null;
  }

  return cleanMarkdownDestination(line.slice(openingIndex + 1, closingIndex));
}

export function extractStandaloneYouTubeUrl(value: string): string | null {
  const line = value.trim();
  const markdownTarget = extractMarkdownLinkDestination(line);
  const candidate = markdownTarget ?? line.replace(/^<([^>]+)>$/, "$1");
  return toCanonicalYouTubeUrl(candidate);
}

export function extractFirstYouTubeUrl(markdown: string): string | null {
  for (const line of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    const standalone = extractStandaloneYouTubeUrl(line);
    if (standalone) {
      return standalone;
    }
  }

  const candidate = markdown.match(
    /https?:\/\/(?:www\.|m\.|music\.)?(?:youtube\.com|youtu\.be)\/[^\s<>"']+/i,
  )?.[0];
  return candidate ? toCanonicalYouTubeUrl(candidate.replace(/[),.;!?]+$/, "")) : null;
}

export function getContentYouTubeUrl(content: Content) {
  const apiUrl = content.youtube_url
    ? toCanonicalYouTubeUrl(content.youtube_url)
    : null;
  return apiUrl ?? extractFirstYouTubeUrl(content.content);
}

export function getContentExcerpt(markdown: string, maxLength = 140) {
  const plain = markdown
    .replace(/!\[[^\]]*\]\([^\n]*\)/g, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/\[([^\]]+)\]\([^\n]*\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/^[#>*+\-\d.\s]+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
