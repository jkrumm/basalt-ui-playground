import { Spinner } from "@blueprintjs/core";

export function DefaultPending() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
      }}
    >
      <Spinner size={40} />
    </div>
  );
}
