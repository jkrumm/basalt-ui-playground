import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000, // 1 minute default — individual queries override
        gcTime: 10 * 60 * 1000,
        retry: 3,
        // refetchOnWindowFocus: true (default) — APIs are cached server-side anyway
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
