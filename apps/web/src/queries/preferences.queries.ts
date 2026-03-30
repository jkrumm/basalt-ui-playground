import type { PatchUserPreferences } from "@cbbi/schemas";
import { queryOptions } from "@tanstack/react-query";
import { getApi } from "~/lib/api";

export function userPreferencesQuery() {
  return queryOptions({
    queryKey: ["user", "preferences"] as const,
    staleTime: 5 * 60 * 1000, // preferences rarely change; avoid refetch-driven atom overwrites
    queryFn: async () => {
      const api = await getApi();
      const res = await api.api.user.preferences.$get();
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    },
  });
}

export function updatePreferencesMutation() {
  return {
    mutationKey: ["user", "preferences", "update"] as const,
    mutationFn: async (body: PatchUserPreferences) => {
      const api = await getApi();
      const res = await api.api.user.preferences.$patch({ json: body });
      if (!res.ok) throw new Error(res.statusText);
      return await res.json();
    },
  };
}
