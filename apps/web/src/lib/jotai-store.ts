import { createStore } from "jotai";

// Single shared store instance used by both the root component and all
// Provider children. Without this, atoms in RootComponent and Provider
// children use different store instances and don't communicate.
export const store = createStore();
