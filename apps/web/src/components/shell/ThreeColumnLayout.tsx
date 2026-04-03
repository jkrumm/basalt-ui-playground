import type { ReactNode } from "react";
import styles from "./ThreeColumnLayout.module.css";

interface Props {
  sidebar: ReactNode;
  children: ReactNode;
  toc: ReactNode;
}

export function ThreeColumnLayout({ sidebar, children, toc }: Props) {
  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>{sidebar}</aside>
      <main className={styles.center}>{children}</main>
      {toc && <aside className={styles.toc}>{toc}</aside>}
    </div>
  );
}
