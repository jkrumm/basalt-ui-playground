import { useLocation } from "@tanstack/react-router";
import { useScrollDepth } from "../../hooks/useScrollDepth";

export function PageLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  useScrollDepth(pathname);
  return <>{children}</>;
}
