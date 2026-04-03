import { Button, Menu, MenuItem, Popover, Spinner } from "@blueprintjs/core";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { authClient } from "~/lib/auth-client.ts";

export function UserIsland() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();
  const router = useRouter();

  if (isPending) return <Spinner size={14} />;

  if (!session) {
    return (
      <Link to="/sign-in" style={{ textDecoration: "none" }}>
        <Button variant="minimal" text="Sign in" />
      </Link>
    );
  }

  return (
    <Popover
      content={
        <Menu>
          <MenuItem text="Account" onClick={() => void navigate({ to: "/account" })} />
          <MenuItem text="Settings" onClick={() => void navigate({ to: "/settings" })} />
          <MenuItem
            text="Sign out"
            intent="danger"
            onClick={async () => {
              try {
                await authClient.signOut();
                await router.invalidate();
                void navigate({ to: "/" });
              } catch {
                // sign-out failure — session state preserved, user remains logged in
              }
            }}
          />
        </Menu>
      }
      placement="bottom-end"
    >
      <Button variant="minimal" text={session.user.name} />
    </Popover>
  );
}
