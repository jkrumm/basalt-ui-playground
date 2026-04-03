import { NonIdealState } from "@blueprintjs/core";
import { Search as SearchIcon } from "@blueprintjs/icons";
import { Flex } from "@blueprintjs/labs";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: NotFound,
});

function NotFound() {
  return (
    <Flex alignItems="center" justifyContent="center" style={{ minHeight: "60vh" }}>
      <NonIdealState
        icon={<SearchIcon />}
        title="Page not found"
        description="The page you're looking for doesn't exist or has been moved."
      />
    </Flex>
  );
}
