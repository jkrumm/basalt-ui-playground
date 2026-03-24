import type { Static } from '@sinclair/typebox'
import { Type } from '@sinclair/typebox'

export const SignInSchema = Type.Object({
  email: Type.String({ format: 'email', minLength: 1 }),
  password: Type.String({ minLength: 8 }),
})

export const SignUpSchema = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 100 }),
  email: Type.String({ format: 'email', minLength: 1 }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
})

export type SignIn = Static<typeof SignInSchema>
export type SignUp = Static<typeof SignUpSchema>
