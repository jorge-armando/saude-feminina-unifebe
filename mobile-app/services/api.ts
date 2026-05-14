const API_BASE_URL = 'http://192.168.100.3:8080/api';

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

export const api = {
  async getContents(): Promise<ContentsResponse> {
    const response = await fetch(`${API_BASE_URL}/contents`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch contents');
    }
    
    return response.json();
  },

  async getContentById(id: number): Promise<{ data: Content }> {
    const response = await fetch(`${API_BASE_URL}/contents/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }
    
    return response.json();
  },

  async searchContents(query: string): Promise<ContentsResponse> {
    const response = await fetch(`${API_BASE_URL}/contents?search=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('Failed to search contents');
    }
    
    return response.json();
  },

  async getContentsByTag(tag: string): Promise<ContentsResponse> {
    const response = await fetch(`${API_BASE_URL}/contents?tags=${encodeURIComponent(tag)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch contents by tag');
    }
    
    return response.json();
  },
};
