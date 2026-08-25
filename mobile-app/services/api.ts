const API_BASE_URL = "https://saudefeminina.tearsense.com.br/api";
const REQUEST_TIMEOUT_MS = 12_000;

export interface Content {
  id: number;
  title: string;
  content: string;
  tags: string;
  reading_time: number;
  created_at: string;
  updated_at: string;
}

export interface ContentsResponse {
  data: Content[];
}

function isContent(value: unknown): value is Content {
  if (!value || typeof value !== "object") {
    return false;
  }

  const content = value as Partial<Content>;
  return (
    Number.isInteger(content.id) &&
    typeof content.title === "string" &&
    typeof content.content === "string" &&
    typeof content.tags === "string" &&
    typeof content.reading_time === "number" &&
    typeof content.created_at === "string" &&
    typeof content.updated_at === "string"
  );
}

export function isPublishableContent(content: Content) {
  const plainBody = content.content
    .replace(/<[^>]*>/g, " ")
    .replace(/[#*_`>\[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    content.title.trim().length >= 5 &&
    plainBody.length >= 80 &&
    Number.isFinite(content.reading_time) &&
    content.reading_time > 0
  );
}

async function request(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`A API respondeu com o status ${response.status}.`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("A consulta de conteúdos demorou mais que o esperado.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
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

  return { data: data.filter(isContent).filter(isPublishableContent) };
}

function parseContentResponse(value: unknown): { data: Content } {
  if (!value || typeof value !== "object") {
    throw new Error("A API retornou uma resposta inválida.");
  }

  const data = (value as { data?: unknown }).data;
  if (!isContent(data) || !isPublishableContent(data)) {
    throw new Error("Este conteúdo não está disponível para publicação.");
  }

  return { data };
}

export const api = {
  async getContents(): Promise<ContentsResponse> {
    return parseContentsResponse(await request("/contents"));
  },

  async getContentById(id: number): Promise<{ data: Content }> {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error("Identificador de conteúdo inválido.");
    }

    return parseContentResponse(await request(`/contents/${id}`));
  },

  async searchContents(query: string): Promise<ContentsResponse> {
    return parseContentsResponse(
      await request(`/contents?search=${encodeURIComponent(query)}`),
    );
  },

  async getContentsByTag(tag: string): Promise<ContentsResponse> {
    return parseContentsResponse(
      await request(`/contents?tags=${encodeURIComponent(tag)}`),
    );
  },
};
