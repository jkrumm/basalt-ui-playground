import type { PatchUserPreferences } from '@cbbi/schemas'
import { queryOptions } from '@tanstack/react-query'
import { getApi } from '~/lib/api'

export function userPreferencesQuery() {
  return queryOptions({
    queryKey: ['user', 'preferences'] as const,
    queryFn: async () => {
      const api = await getApi()
      const { data, error } = await api.user.preferences.get()
      if (error)
        throw error.value
      return data!
    },
  })
}

export function updatePreferencesMutation() {
  return {
    mutationKey: ['user', 'preferences', 'update'] as const,
    mutationFn: async (body: PatchUserPreferences) => {
      const api = await getApi()
      const { data, error } = await api.user.preferences.patch(body)
      if (error)
        throw error.value
      return data!
    },
  }
}
