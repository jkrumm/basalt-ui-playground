import type { ReactNode } from "react";
import { Drawer } from "@blueprintjs/core";
import { useAtom } from "jotai";
import { mobileDrawerOpenAtom } from "~/atoms/ui.atoms.ts";
import { store } from "~/lib/jotai-store.ts";

interface Props {
  children: ReactNode;
}

export function MobileDrawer({ children }: Props) {
  const [isOpen, setIsOpen] = useAtom(mobileDrawerOpenAtom, { store });

  return (
    <Drawer
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      position="left"
      size="280px"
      title="Navigation"
    >
      {children}
    </Drawer>
  );
}
