import { Button, Callout, Card, H4 } from "@blueprintjs/core";
import { SignInSchema } from "@cbbi/schemas";
import { z } from "zod";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { useAppForm } from "../lib/form.tsx";
import { zodFormValidator } from "../lib/validation";

const SignInSearch = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>) => {
    const result = SignInSearch.safeParse(search);
    return result.success ? result.data : {};
  },
  component: SignInPage,
});

function SignInPage() {
  const { redirect = "/" } = Route.useSearch();
  const router = useRouter();
  const [authError, setAuthError] = useState("");

  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: zodFormValidator(SignInSchema) },
    onSubmit: async ({ value }) => {
      setAuthError("");
      const { error } = await authClient.signIn.email(value);
      if (error) {
        setAuthError(error.message ?? "Sign in failed");
        return;
      }
      await router.invalidate();
      window.location.assign(redirect);
    },
  });

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "calc(100vh - 50px)",
        padding: "2rem",
      }}
    >
      <Card style={{ width: 360 }}>
        <H4 style={{ marginTop: 0 }}>Sign in</H4>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="email">
            {(field) => (
              <field.TextField label="Email" type="email" placeholder="you@example.com" />
            )}
          </form.AppField>
          <form.AppField name="password">
            {(field) => <field.TextField label="Password" type="password" placeholder="••••••••" />}
          </form.AppField>
          {authError && (
            <Callout intent="danger" style={{ marginBottom: "1rem" }}>
              {authError}
            </Callout>
          )}
          <form.Subscribe
            selector={(state) => ({ isSubmitting: state.isSubmitting, canSubmit: state.canSubmit })}
          >
            {({ isSubmitting, canSubmit }) => (
              <Button
                type="submit"
                intent="primary"
                text="Sign in"
                loading={isSubmitting}
                disabled={!canSubmit}
                fill
              />
            )}
          </form.Subscribe>
        </form>
        <p style={{ marginBottom: 0, marginTop: "1rem", textAlign: "center" }}>
          Don't have an account? <Link to="/sign-up">Sign up</Link>
        </p>
      </Card>
    </div>
  );
}
