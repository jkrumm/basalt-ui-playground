import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

export const UserPreferencesSchema = Type.Object({
  theme: Type.Union(
    [Type.Literal('light'), Type.Literal('dark'), Type.Literal('system')],
    { default: 'system', description: 'UI color theme' },
  ),
  viewMode: Type.Union(
    [Type.Literal('grid'), Type.Literal('table')],
    { default: 'grid', description: 'Indicator display mode' },
  ),
  sortBy: Type.Union(
    [
      Type.Literal('default'),
      Type.Literal('value-asc'),
      Type.Literal('value-desc'),
      Type.Literal('name-asc'),
    ],
    { default: 'default', description: 'Indicator sort order' },
  ),
})

export const PatchUserPreferencesSchema = Type.Partial(UserPreferencesSchema)

export type UserPreferences = Static<typeof UserPreferencesSchema>
export type PatchUserPreferences = Static<typeof PatchUserPreferencesSchema>
