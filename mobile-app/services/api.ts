const API_BASE_URL = "https://saudefeminina.tearsense.com.br/api";
const SITE_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_CONTENT_PAGES = 10;

let requestSequence = 0;

function decodeHtmlUrl(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/\\([()])/g, "$1")
    .trim();
}

/**
 * Normaliza imagens retornadas pelo editor. O upload do painel historicamente
 * devolveu caminhos como `/storage/...`, enquanto artigos antigos também podem
 * conter URLs absolutas de outros hosts.
 */
export function resolveContentAssetUrl(url: string): string | null {
  let trimmed = decodeHtmlUrl(url);
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  try {
    const resolved = trimmed.startsWith("//")
      ? `https:${trimmed}`
      : trimmed.startsWith("/")
        ? `${SITE_ORIGIN}${trimmed}`
        : /^[a-z][a-z\d+.-]*:/i.test(trimmed)
          ? trimmed
          : `${SITE_ORIGIN}/${trimmed.replace(/^\.\//, "")}`;

    const parsed = new URL(resolved);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }

    // Evita conteúdo misto quando uma URL antiga aponta para o mesmo servidor.
    if (parsed.hostname === new URL(SITE_ORIGIN).hostname) {
      parsed.protocol = "https:";
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export interface Content {
  id: number;
  title: string;
  content: string;
  tags: string;
  reading_time: number;
  /** Posição global 1-based; a API entrega a coleção em ordem crescente. */
  position: number | null;
  /** Atalho da API para position === 1. */
  is_featured: boolean;
  /** URL absoluta da primeira imagem Markdown/HTML, quando houver. */
  image_url: string | null;
  /** URL canônica watch do YouTube, validada no servidor. */
  youtube_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentsResponse {
  data: Content[];
}

function parseOptionalUrl(value: unknown): string | null {
  return typeof value === "string" ? resolveContentAssetUrl(value) : null;
}

function parseContent(value: unknown): Content | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const content = value as Record<string, unknown>;
  const id = typeof content.id === "number" ? content.id : Number(content.id);
  const readingTime =
    typeof content.reading_time === "number"
      ? content.reading_time
      : Number(content.reading_time);
  const rawPosition =
    typeof content.position === "number"
      ? content.position
      : Number(content.position);

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    typeof content.title !== "string" ||
    typeof content.content !== "string" ||
    !Number.isFinite(readingTime) ||
    readingTime <= 0 ||
    typeof content.created_at !== "string" ||
    typeof content.updated_at !== "string"
  ) {
    return null;
  }

  const position =
    Number.isSafeInteger(rawPosition) && rawPosition > 0 ? rawPosition : null;

  return {
    id,
    title: content.title,
    content: content.content,
    // Tags são opcionais no painel; o app usa string vazia como representação.
    tags: typeof content.tags === "string" ? content.tags : "",
    reading_time: readingTime,
    position,
    is_featured:
      typeof content.is_featured === "boolean"
        ? content.is_featured
        : content.is_featured === 1 || position === 1,
    image_url: parseOptionalUrl(content.image_url),
    youtube_url: parseOptionalUrl(content.youtube_url),
    created_at: content.created_at,
    updated_at: content.updated_at,
  };
}

export function orderContents(contents: Content[]) {
  return contents
    .map((content, index) => ({ content, index }))
    .sort((first, second) => {
      const firstPosition = first.content.position ?? Number.MAX_SAFE_INTEGER;
      const secondPosition = second.content.position ?? Number.MAX_SAFE_INTEGER;
      return firstPosition - secondPosition || first.index - second.index;
    })
    .map(({ content }) => content);
}

export function getFeaturedContent(contents: Content[]) {
  return (
    contents.find((content) => content.is_featured) ??
    contents.find((content) => content.position === 1) ??
    contents[0]
  );
}

interface RequestOptions {
  signal?: AbortSignal;
}

async function request(path: string, options: RequestOptions = {}): Promise<unknown> {
  const controller = new AbortController();
  const abortFromQuery = () => controller.abort();
  options.signal?.addEventListener("abort", abortFromQuery, { once: true });
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = new URL(`${API_BASE_URL}${path}`);
    // Cada execução da query precisa atravessar caches intermediários. O
    // React Query continua sendo o cache de interface entre os refetches.
    requestSequence += 1;
    url.searchParams.set("_fresh", `${Date.now()}-${requestSequence}`);

    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Cache-Control": "no-cache, no-store",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`A API respondeu com o status ${response.status}.`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      if (options.signal?.aborted) {
        throw error;
      }
      throw new Error("A consulta de conteúdos demorou mais que o esperado.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abortFromQuery);
  }
}

function parseContentsResponse(value: unknown): ContentsResponse {
  if (!value || typeof value !== "object") {
    throw new Error("A API retornou uma resposta inválida.");
  }

  const data = (value as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    throw new Error("A lista de conteúdos está em um formato inválido.");
  }

  // Publicação é decisão do servidor. Não descarte artigos curtos ou sem
  // tags no cliente: isso fazia itens recém-cadastrados sumirem do aplicativo.
  return {
    data: orderContents(
      data.map(parseContent).filter((content): content is Content => !!content),
    ),
  };
}

function getPaginationLastPage(value: unknown) {
  if (!value || typeof value !== "object") {
    return 1;
  }

  const meta = (value as { meta?: unknown }).meta;
  if (!meta || typeof meta !== "object") {
    return 1;
  }

  const rawLastPage = (meta as { last_page?: unknown }).last_page;
  const lastPage =
    typeof rawLastPage === "number" ? rawLastPage : Number(rawLastPage);
  return Number.isSafeInteger(lastPage) && lastPage > 1
    ? Math.min(lastPage, MAX_CONTENT_PAGES)
    : 1;
}

async function getAllContentPages(
  path: string,
  options: RequestOptions,
): Promise<ContentsResponse> {
  const firstPage = await request(path, options);
  const lastPage = getPaginationLastPage(firstPage);
  if (lastPage === 1) {
    return parseContentsResponse(firstPage);
  }

  const remainingPages = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, index) =>
      request(`${path}&page=${index + 2}`, options),
    ),
  );
  const combinedData = [firstPage, ...remainingPages].flatMap((page) => {
    if (!page || typeof page !== "object") {
      return [];
    }

    const data = (page as { data?: unknown }).data;
    return Array.isArray(data) ? data : [];
  });

  return parseContentsResponse({ data: combinedData });
}

function parseContentResponse(value: unknown): { data: Content } {
  if (!value || typeof value !== "object") {
    throw new Error("A API retornou uma resposta inválida.");
  }

  const data = parseContent((value as { data?: unknown }).data);
  if (!data) {
    throw new Error("Este conteúdo não está disponível.");
  }

  return { data };
}

export const api = {
  async getContents(options: RequestOptions = {}): Promise<ContentsResponse> {
    // O limite explícito evita que o destaque global fique fora da primeira
    // página em servidores que ainda usam paginação por padrão.
    return getAllContentPages("/contents?per_page=50", options);
  },

  async getContentById(
    id: number,
    options: RequestOptions = {},
  ): Promise<{ data: Content }> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Identificador de conteúdo inválido.");
    }

    return parseContentResponse(await request(`/contents/${id}`, options));
  },

  async searchContents(
    query: string,
    options: RequestOptions = {},
  ): Promise<ContentsResponse> {
    return getAllContentPages(
      `/contents?per_page=50&search=${encodeURIComponent(query)}`,
      options,
    );
  },

  async getContentsByTag(
    tag: string,
    options: RequestOptions = {},
  ): Promise<ContentsResponse> {
    return getAllContentPages(
      `/contents?per_page=50&tags=${encodeURIComponent(tag)}`,
      options,
    );
  },
};
