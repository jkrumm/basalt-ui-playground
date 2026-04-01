import { Button, Card, Elevation, H1, H5, Intent, Tag } from "@blueprintjs/core";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client.ts";

export const Route = createFileRoute("/_protected/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    await router.navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Card elevation={Elevation.TWO} style={{ maxWidth: 480, width: "100%" }}>
        <H1>Settings</H1>
        <H5 className="bp6-text-muted">Account Information</H5>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="bp6-text-muted text-sm">Name</span>
            <Tag minimal>{user.name}</Tag>
          </div>
          <div className="flex items-center gap-2">
            <span className="bp6-text-muted text-sm">Email</span>
            <Tag minimal>{user.email}</Tag>
          </div>
          <div className="flex items-center gap-2">
            <span className="bp6-text-muted text-sm">Verified</span>
            <Tag intent={user.emailVerified ? Intent.SUCCESS : Intent.WARNING} minimal>
              {user.emailVerified ? "Yes" : "No"}
            </Tag>
          </div>
        </div>
        <div className="mt-6">
          <Button intent={Intent.DANGER} onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </Card>
    </div>
  );
}
