import { useQuery } from '@tanstack/react-query';
import { api, Content } from '../services/api';

export function useContents() {
  return useQuery({
    queryKey: ['contents'],
    queryFn: api.getContents,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useContent(id: number) {
  return useQuery({
    queryKey: ['content', id],
    queryFn: () => api.getContentById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchContents(query: string) {
  return useQuery({
    queryKey: ['contents', 'search', query],
    queryFn: () => api.searchContents(query),
    enabled: query.length > 2,
    staleTime: 2 * 60 * 1000,
  });
}

export function useContentsByTag(tag: string) {
  return useQuery({
    queryKey: ['contents', 'tag', tag],
    queryFn: () => api.getContentsByTag(tag),
    enabled: !!tag && tag !== 'Todos',
    staleTime: 5 * 60 * 1000,
  });
}
