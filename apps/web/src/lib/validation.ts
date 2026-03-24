import type { TSchema } from '@sinclair/typebox'
import { Value } from '@sinclair/typebox/value'

const LEADING_SLASH_RE = /^\//

/**
 * Creates a TanStack Form field validator from a TypeBox schema.
 * TypeBox 0.34.x does not implement Standard Schema, so this adapter bridges the gap.
 *
 * Usage:
 *   <form.AppField name="email" validators={{ onChange: typeboxValidator(Type.String({ format: 'email' })) }}>
 */
export function typeboxValidator<T extends TSchema>(schema: T) {
  return ({ value }: { value: unknown }) => {
    const input = structuredClone(value) ?? ''
    const withDefaults = Value.Default(schema, input)
    if (Value.Check(schema, withDefaults))
      return undefined
    return Array.from(Value.Errors(schema, withDefaults), e => e.message).join('; ')
  }
}

/**
 * Creates a whole-form validator from a TypeBox object schema.
 * Maps TypeBox path errors to TanStack Form field-level errors.
 *
 * Usage:
 *   useAppForm({ validators: { onChange: typeboxFormValidator(SignInSchema) } })
 */
export function typeboxFormValidator<T extends TSchema>(schema: T) {
  return ({ value }: { value: unknown }) => {
    const withDefaults = Value.Default(schema, structuredClone(value) ?? {})
    if (Value.Check(schema, withDefaults))
      return undefined
    const fields = Array.from(Value.Errors(schema, withDefaults)).reduce<Record<string, string>>(
      (acc, err) => {
        const field = err.path.replace(LEADING_SLASH_RE, '') || 'root'
        if (!acc[field])
          acc[field] = err.message
        return acc
      },
      {},
    )
    return { fields }
  }
}
