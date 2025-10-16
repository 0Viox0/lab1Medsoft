import { cn } from "@/lib/utils";
import type { FC, ReactNode } from "react";

export type SelectSquare = {
  children: ReactNode;
  selected?: boolean;
};

export const SelectSquare: FC<SelectSquare> = ({
  children,
  selected = false,
}) => {
  return (
    <div
      className={cn(
        "w-[48px] h-[48px] rounded-[12px] border-[1px]  flex justify-center items-center hover:cursor-pointer hover:scale-[1.02]",
        {
          "border-[#929292] bg-[#464343]": selected,
          "border-[#373737] bg-[#151515]": !selected,
        },
      )}
    >
      {children}
    </div>
  );
};
