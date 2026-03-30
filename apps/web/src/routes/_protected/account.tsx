import { Button, Card, Elevation, H2, H4, Tag } from "@blueprintjs/core";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client";
import { PageLayout } from "~/components/layout/PageLayout";

export const Route = createFileRoute("/_protected/account")({
  component: AccountPage,
});

function AccountPage() {
  // User is loaded server-side in _protected.tsx beforeLoad — no extra fetch needed
  const { user, sessionExpiresAt } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();

  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const expiresDate = new Date(sessionExpiresAt);
  const isExpiringSoon = expiresDate.getTime() - Date.now() < 1000 * 60 * 60 * 24; // < 24h

  return (
    <PageLayout>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1rem" }}>
        <H2 style={{ marginTop: 0, marginBottom: 24 }}>Account</H2>

        {/* Identity card */}
        <Card elevation={Elevation.ONE} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "var(--blue3, #215db0)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <H4 style={{ margin: 0, marginBottom: 2 }}>{user.name}</H4>
              <p style={{ margin: 0, opacity: 0.65, fontSize: 14 }}>{user.email}</p>
            </div>
          </div>
        </Card>

        {/* Session details */}
        <Card elevation={Elevation.ONE} style={{ marginBottom: 16 }}>
          <H4 style={{ marginTop: 0, marginBottom: 12 }}>Session</H4>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "6px 0", fontWeight: 500, width: "40%" }}>Status</td>
                <td style={{ padding: "6px 0" }}>
                  <Tag intent="success" minimal>
                    Active
                  </Tag>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", fontWeight: 500 }}>Expires</td>
                <td style={{ padding: "6px 0" }}>
                  <Tag intent={isExpiringSoon ? "warning" : "none"} minimal>
                    {expiresDate.toLocaleString()}
                  </Tag>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", fontWeight: 500 }}>Email</td>
                <td style={{ padding: "6px 0" }}>
                  <Tag intent={user.emailVerified ? "success" : "warning"} minimal>
                    {user.emailVerified ? "Verified" : "Not verified"}
                  </Tag>
                </td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", fontWeight: 500 }}>User ID</td>
                <td
                  style={{
                    padding: "6px 0",
                    fontFamily: "monospace",
                    fontSize: 12,
                    opacity: 0.6,
                    wordBreak: "break-all",
                  }}
                >
                  {user.id}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        <Button
          intent="danger"
          variant="outlined"
          text="Sign out"
          onClick={async () => {
            await authClient.signOut();
            await router.invalidate();
            void navigate({ to: "/" });
          }}
        />
      </div>
    </PageLayout>
  );
}
