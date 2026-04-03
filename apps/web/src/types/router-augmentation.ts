import type { IconName } from "@blueprintjs/icons";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    nav?: {
      label: string;
      icon?: IconName;
      description?: string;
      order?: number;
      level: 1 | 2 | 3;
      group?: string;
      hideFromNav?: boolean;
      breadcrumb?: string;
    };
  }
}

export {};
