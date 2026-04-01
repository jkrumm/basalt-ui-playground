import type { PatchUserPreferences } from "@cbbi/schemas";
import { queryOptions } from "@tanstack/react-query";
import { api } from "../lib/api.ts";

export function userPreferencesQuery() {
  return queryOptions({
    queryKey: ["user", "preferences"] as const,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await api.api.user.preferences.get();
      if (error) throw new Error(String(error));
      return data;
    },
  });
}

export function updatePreferencesMutation() {
  return {
    mutationKey: ["user", "preferences", "update"] as const,
    mutationFn: async (body: PatchUserPreferences) => {
      const { data, error } = await api.api.user.preferences.patch(body);
      if (error) throw new Error(String(error));
      return data;
    },
  };
}
