import { createStore } from "jotai";

// Single shared store instance used by both the root component (which renders
// <Provider> as a descendant, not an ancestor) and all Provider children.
// Without this, useAtom in RootComponent uses the global default store while
// ContentNav's useSetAtom uses the Provider's isolated store — two separate
// atom instances that don't communicate.
export const appStore = createStore();
