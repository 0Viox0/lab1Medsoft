import type { FC } from "react";
import { Logo } from "../icons/Logo";
import { cn } from "@/lib/utils";

export type SecondaryPart = "ReceptionUI" | "HospitalChiefUI";

export type HeadingProps = {
  secondaryPart: string;
  className?: string;
};

export const Heading: FC<HeadingProps> = ({ secondaryPart, className }) => {
  return (
    <div className={cn("flex items-center", className)}>
      <Logo width="53" height="53" />
      <h1 className="ml-4 text-[1.5rem]">
        <span className=" font-bold">Medsoft.</span>
        {secondaryPart}
      </h1>
    </div>
  );
};
