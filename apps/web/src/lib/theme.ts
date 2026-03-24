import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie } from '@tanstack/react-start/server'

export type Theme = 'light' | 'dark' | 'system'

const THEME_COOKIE = 'theme'

export const getThemeFn = createServerFn({ method: 'GET' }).handler((): Theme => {
  const value = getCookie(THEME_COOKIE)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
})

export const setThemeFn = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown): Theme => {
    if (data !== 'light' && data !== 'dark' && data !== 'system')
      throw new Error('Invalid theme value')
    return data
  })
  .handler(({ data }): void => {
    setCookie(THEME_COOKIE, data, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  })
