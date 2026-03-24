/* eslint-disable react-refresh/only-export-components -- infrastructure file: intentionally mixes Blueprint field components with createFormHook exports */
import type { Intent } from '@blueprintjs/core'
import { Checkbox, FormGroup, HTMLSelect, InputGroup } from '@blueprintjs/core'
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

export const { fieldContext, formContext, useFieldContext } = createFormHookContexts()

// Blueprint InputGroup wired to a TanStack Form field
function TextField({
  label,
  type = 'text',
  placeholder,
  helperText,
}: {
  label: string
  type?: React.InputHTMLAttributes<HTMLInputElement>['type']
  placeholder?: string
  helperText?: string
}) {
  const field = useFieldContext<string>()
  const hasError = field.state.meta.isTouched && field.state.meta.errors.length > 0
  const intent: Intent = hasError ? 'danger' : 'none'

  return (
    <FormGroup
      label={label}
      intent={intent}
      helperText={hasError ? field.state.meta.errors.join('; ') : helperText}
    >
      <InputGroup
        type={type}
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        intent={intent}
        placeholder={placeholder}
      />
    </FormGroup>
  )
}

// Blueprint HTMLSelect wired to a TanStack Form field
function SelectField<T extends string>({
  label,
  options,
}: {
  label: string
  options: { value: T, label: string }[]
}) {
  const field = useFieldContext<T>()

  return (
    <FormGroup label={label}>
      <HTMLSelect
        value={field.state.value}
        onChange={e => field.handleChange(e.target.value as T)}
        onBlur={field.handleBlur}
        options={options}
      />
    </FormGroup>
  )
}

// Blueprint Checkbox wired to a TanStack Form field
function CheckboxField({ label }: { label: string }) {
  const field = useFieldContext<boolean>()

  return (
    <Checkbox
      label={label}
      checked={field.state.value}
      onChange={e => field.handleChange((e.target as HTMLInputElement).checked)}
    />
  )
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
    SelectField,
    CheckboxField,
  },
  formComponents: {},
})
