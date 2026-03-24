import type { UserPreferences } from '@cbbi/schemas'
import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

// Session-only atoms — cleared on page close
export const searchOpenAtom = atom<boolean>(false)

// Persistent atoms — survive page refresh via localStorage
export const viewModeAtom = atomWithStorage<UserPreferences['viewMode']>(
  'cbbi-view-mode',
  'grid',
)

export const sortByAtom = atomWithStorage<UserPreferences['sortBy']>(
  'cbbi-sort-by',
  'default',
)
