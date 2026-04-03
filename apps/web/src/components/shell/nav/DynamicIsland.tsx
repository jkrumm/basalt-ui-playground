import type { ReactNode } from "react";
import { Suspense } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export function DynamicIsland({ children, fallback = null }: Props) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}
