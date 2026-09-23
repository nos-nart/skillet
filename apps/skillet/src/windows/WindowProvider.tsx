import type { ReactNode } from "react";
import { createContext } from "react";

const WindowContext = createContext<string>("");

type WindowProviderProps = {
  children: ReactNode;
  id: string;
};

export function WindowProvider({ children, id }: WindowProviderProps) {
  return <WindowContext.Provider value={id}>{children}</WindowContext.Provider>;
}
