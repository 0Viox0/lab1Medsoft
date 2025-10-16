import type { FC, ReactNode } from "react";

export type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  return <div className="dark">{children}</div>;
};
