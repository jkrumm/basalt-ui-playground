import {
  Button,
  Card,
  Callout,
  Elevation,
  FormGroup,
  H2,
  H5,
  InputGroup,
  Intent,
} from "@blueprintjs/core";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "~/lib/auth-client.ts";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
  }),
  component: SignInPage,
});

function SignInPage() {
  const router = useRouter();
  const { redirect } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: authError } = await authClient.signIn.email({ email, password });
      if (authError) {
        setError(authError.message ?? "Sign in failed");
        return;
      }
      await router.navigate({ to: redirect ?? "/" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card elevation={Elevation.TWO} style={{ maxWidth: 400, width: "100%" }}>
        <H2>Sign In</H2>
        <H5 className="bp6-text-muted">Welcome back</H5>
        {error && (
          <Callout intent={Intent.DANGER} className="mb-4">
            {error}
          </Callout>
        )}
        <form onSubmit={handleSubmit} className="mt-4">
          <FormGroup label="Email" labelFor="email">
            <InputGroup
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@example.com"
              required
            />
          </FormGroup>
          <FormGroup label="Password" labelFor="password">
            <InputGroup
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </FormGroup>
          <div className="mt-4 flex items-center justify-between">
            <Button type="submit" intent={Intent.PRIMARY} loading={pending}>
              Sign In
            </Button>
            <Link to="/sign-up" className="bp6-text-muted text-sm">
              Create account
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
