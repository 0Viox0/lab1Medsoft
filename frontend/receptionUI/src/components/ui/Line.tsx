import { cn } from "@/lib/utils";
import type { FC } from "react";

export type LineProps = {
  height?: string;
  className?: string;
};

export const Line: FC<LineProps> = ({ height, className }) => {
  return (
    <div className={cn("w-[1px] bg-white", className)} style={{ height }}></div>
  );
};
