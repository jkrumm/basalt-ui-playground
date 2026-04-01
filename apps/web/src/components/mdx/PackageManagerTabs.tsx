import { Code, Tab, Tabs } from "@blueprintjs/core";
import { useState } from "react";
import { CodeBlock } from "./CodeBlock.tsx";

interface PackageManagerTabsProps {
  // e.g., "add react react-dom" or "run build"
  command: string;
}

type Manager = "Bun" | "npm" | "pnpm" | "yarn";

const ADD_RE = /^add\b/;

function buildCommand(manager: Manager, command: string): string {
  // Map "add" → "install" for npm
  const npmCommand = command.replace(ADD_RE, "install");
  switch (manager) {
    case "Bun":
      return `bun ${command}`;
    case "npm":
      return `npm ${npmCommand}`;
    case "pnpm":
      return `pnpm ${command}`;
    case "yarn":
      return `yarn ${command}`;
  }
}

const MANAGERS: Manager[] = ["pnpm", "npm", "yarn", "Bun"];

export function PackageManagerTabs({ command }: PackageManagerTabsProps) {
  const [selected, setSelected] = useState<string>("pnpm");

  return (
    <div className="mdx-pm-tabs">
      <Tabs
        id="pkg-manager"
        selectedTabId={selected}
        onChange={(id) => setSelected(String(id))}
        animate={false}
      >
        {MANAGERS.map((manager) => (
          <Tab
            key={manager}
            id={manager}
            title={manager}
            panel={
              <CodeBlock className="language-bash" style={{ background: "#1c2127" }}>
                <Code>{buildCommand(manager, command)}</Code>
              </CodeBlock>
            }
          />
        ))}
      </Tabs>
    </div>
  );
}
