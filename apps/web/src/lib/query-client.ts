import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes — data stays fresh
      gcTime: 1000 * 60 * 10, // 10 minutes — cache retained
      retry: 1, // one retry on failure
      refetchOnWindowFocus: false, // less aggressive for this app
    },
    mutations: {
      retry: 0,
    },
  },
});

// Usage in route loaders:
// loader: () => queryClient.ensureQueryData(userPreferencesQuery())
// Then in component: const { data } = useSuspenseQuery(userPreferencesQuery())
