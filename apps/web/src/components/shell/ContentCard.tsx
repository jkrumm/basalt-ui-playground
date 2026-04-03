import type { ReactNode } from "react";
import { Card, Elevation } from "@blueprintjs/core";
import styles from "./ContentCard.module.css";

interface Props {
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}

export function ContentCard({ children, className, scrollable = true }: Props) {
  const cls = [scrollable ? styles.scrollable : "", className].filter(Boolean).join(" ");
  return (
    <Card elevation={Elevation.ONE} className={cls || undefined}>
      {children}
    </Card>
  );
}
