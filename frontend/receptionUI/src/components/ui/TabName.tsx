import { cn } from "@/lib/utils";
import type { FC, ReactNode } from "react";

export type TabNameProps = {
  children: ReactNode;
  className?: string;
};

export const TabName: FC<TabNameProps> = ({ children, className }) => {
  return (
    <div className={cn("text-[1.3rem] text-[#17f286]", className)}>
      {children}
    </div>
  );
};
