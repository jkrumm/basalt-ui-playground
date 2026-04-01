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

export const Route = createFileRoute("/sign-up")({
  component: SignUpPage,
});

function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error: authError } = await authClient.signUp.email({ name, email, password });
      if (authError) {
        setError(authError.message ?? "Sign up failed");
        return;
      }
      await router.navigate({ to: "/" });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card elevation={Elevation.TWO} style={{ maxWidth: 400, width: "100%" }}>
        <H2>Create Account</H2>
        <H5 className="bp6-text-muted">Get started with CBBI</H5>
        {error && (
          <Callout intent={Intent.DANGER} className="mb-4">
            {error}
          </Callout>
        )}
        <form onSubmit={handleSubmit} className="mt-4">
          <FormGroup label="Name" labelFor="name">
            <InputGroup
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
            />
          </FormGroup>
          <FormGroup label="Email" labelFor="email">
            <InputGroup
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </FormGroup>
          <FormGroup label="Password" labelFor="password">
            <InputGroup
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              minLength={8}
              required
            />
          </FormGroup>
          <div className="mt-4 flex items-center justify-between">
            <Button type="submit" intent={Intent.PRIMARY} loading={pending}>
              Create Account
            </Button>
            <Link to="/sign-in" className="bp6-text-muted text-sm">
              Sign in instead
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
