import { Button } from "@blueprintjs/core";
import { Link, useMatchRoute } from "@tanstack/react-router";
import { l1MainRoutes } from "~/lib/nav.config.ts";

export function MainNavLinks() {
  const matchRoute = useMatchRoute();

  return (
    <>
      {l1MainRoutes.map((item) => {
        const isActive = !!matchRoute({ to: item.to, fuzzy: true });
        return (
          <Link key={item.to} to={item.to} style={{ textDecoration: "none" }}>
            <Button variant="minimal" icon={item.icon} text={item.label} active={isActive} />
          </Link>
        );
      })}
    </>
  );
}
