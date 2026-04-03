import { Button, Card, Elevation, H2, H4, HTMLTable, Tag } from "@blueprintjs/core";
import { Box, Flex } from "@blueprintjs/labs";
import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client.ts";
import { PageLayout } from "~/components/layout/PageLayout.tsx";

export const Route = createFileRoute("/_protected/account")({
  component: AccountPage,
});

function AccountPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const router = useRouter();

  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <PageLayout>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1rem" }}>
        <Box marginBottom={6}>
          <H2 style={{ marginTop: 0 }}>Account</H2>
        </Box>

        {/* Identity card */}
        <Box marginBottom={4}>
          <Card elevation={Elevation.ONE}>
            <Flex alignItems="center" gap={4}>
              <Flex
                alignItems="center"
                justifyContent="center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--bp-intent-primary-rest)",
                  color: "var(--bp-intent-primary-foreground)",
                  fontSize: 18,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {initials}
              </Flex>
              <div style={{ minWidth: 0 }}>
                <H4 style={{ margin: 0, marginBottom: 2 }}>{user.name}</H4>
                <p
                  style={{
                    margin: 0,
                    color: "var(--bp-typography-color-default-disabled)",
                    fontSize: 14,
                  }}
                >
                  {user.email}
                </p>
              </div>
            </Flex>
          </Card>
        </Box>

        {/* Session details */}
        <Box marginBottom={4}>
          <Card elevation={Elevation.ONE}>
            <H4 style={{ marginTop: 0, marginBottom: 12 }}>Session</H4>
            <HTMLTable style={{ width: "100%", borderCollapse: "collapse" }}>
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
            </HTMLTable>
          </Card>
        </Box>

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
