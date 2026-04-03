import { Button, NonIdealState } from "@blueprintjs/core";
import { Error as ErrorIcon } from "@blueprintjs/icons";
import type { ErrorInfo } from "react";

interface DefaultErrorProps {
  error: Error;
  reset: () => void;
  info?: ErrorInfo;
}

export function DefaultError({ error, reset }: DefaultErrorProps) {
  // Captured by HyperDX browser SDK — correlates with the active trace
  console.error("[DefaultError]", error);

  return (
    <NonIdealState
      icon={<ErrorIcon />}
      title="Something went wrong"
      description={error.message || "An unexpected error occurred."}
      action={<Button intent="primary" text="Try Again" onClick={reset} />}
    />
  );
}
