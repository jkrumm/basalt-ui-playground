import { Button, Callout, Card, H4 } from "@blueprintjs/core";
import { SignUpSchema } from "@cbbi/schemas";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "../lib/auth-client";
import { useAppForm } from "../lib/form.tsx";
import { zodFormValidator } from "../lib/validation";

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState("");

  const form = useAppForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: { onChange: zodFormValidator(SignUpSchema) },
    onSubmit: async ({ value }) => {
      setAuthError("");
      const { error } = await authClient.signUp.email(value);
      if (error) {
        setAuthError(error.message ?? "Sign up failed");
        return;
      }
      void navigate({ to: "/sign-in" });
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
        <H4 style={{ marginTop: 0 }}>Create account</H4>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <form.AppField name="name">
            {(field) => <field.TextField label="Name" placeholder="Your name" />}
          </form.AppField>
          <form.AppField name="email">
            {(field) => (
              <field.TextField label="Email" type="email" placeholder="you@example.com" />
            )}
          </form.AppField>
          <form.AppField name="password">
            {(field) => (
              <field.TextField
                label="Password"
                type="password"
                placeholder="At least 8 characters"
              />
            )}
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
                text="Create account"
                loading={isSubmitting}
                disabled={!canSubmit}
                fill
              />
            )}
          </form.Subscribe>
        </form>
        <p style={{ marginBottom: 0, marginTop: "1rem", textAlign: "center" }}>
          Already have an account? <Link to="/sign-in">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}
