import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "../services/api";

const CONTENTS_QUERY_KEY = ["contents"] as const;

export function useContents() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: CONTENTS_QUERY_KEY,
    queryFn: ({ signal }) => api.getContents({ signal }),
    refetchOnMount: "always",
    refetchOnReconnect: true,
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    for (const content of query.data?.data ?? []) {
      queryClient.setQueryData(["content", content.id], { data: content });
    }
  }, [query.data, queryClient]);

  return query;
}

export function useContent(id: number) {
  const isValidId = Number.isInteger(id) && id > 0;

  return useQuery({
    queryKey: ["content", id],
    queryFn: ({ signal }) => api.getContentById(id, { signal }),
    enabled: isValidId,
    refetchOnMount: "always",
    refetchOnReconnect: true,
    staleTime: 60 * 1000,
  });
}

export function useSearchContents(query: string) {
  return useQuery({
    queryKey: ["contents", "search", query],
    queryFn: ({ signal }) => api.searchContents(query, { signal }),
    enabled: query.length > 2,
    staleTime: 2 * 60 * 1000,
  });
}

export function useContentsByTag(tag: string) {
  return useQuery({
    queryKey: ["contents", "tag", tag],
    queryFn: ({ signal }) => api.getContentsByTag(tag, { signal }),
    enabled: !!tag && tag !== "Todos",
    staleTime: 5 * 60 * 1000,
  });
}
