import type { ZodTypeAny } from "zod";

// Per-field validator — used in form.AppField validators.onChange
export function zodValidator<T extends ZodTypeAny>(schema: T) {
  return ({ value }: { value: unknown }) => {
    const result = schema.safeParse(value ?? "");
    if (result.success) return undefined;
    return result.error.issues.map((i) => i.message).join("; ");
  };
}

// Whole-form validator — maps Zod path errors to TanStack Form field-level errors
export function zodFormValidator<T extends ZodTypeAny>(schema: T) {
  return ({ value }: { value: unknown }) => {
    const result = schema.safeParse(value ?? {});
    if (result.success) return undefined;
    const fields = result.error.issues.reduce<Record<string, string>>((acc, issue) => {
      const field = issue.path.join(".") || "root";
      if (!acc[field]) acc[field] = issue.message;
      return acc;
    }, {});
    return { fields };
  };
}
