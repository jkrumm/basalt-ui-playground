import type { ReactNode } from "react";
import styles from "./ShellContainer.module.css";

interface Props {
  children: ReactNode;
}

export function ShellContainer({ children }: Props) {
  return <div className={styles.shellContainer}>{children}</div>;
}
