import type { ReactNode } from "react";
import styles from "./ContentCard.module.css";

interface Props {
  children: ReactNode;
  className?: string;
}

export function ContentCard({ children, className }: Props) {
  return (
    <div className={className ? `${styles.contentCard} ${className}` : styles.contentCard}>
      {children}
    </div>
  );
}
