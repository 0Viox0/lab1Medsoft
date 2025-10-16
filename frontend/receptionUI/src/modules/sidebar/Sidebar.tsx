import { Line } from "@/components/ui/Line";
import { SelectSquare } from "@/components/ui/SelectSquare";
import { Heading } from "@/components/widgets/Heading";
import type { FC } from "react";
import { Link, Outlet, useLocation } from "react-router";

export type SidebarProps = {
  appName: string;
};

export const Sidebar: FC<SidebarProps> = ({ appName }) => {
  const location = useLocation();

  return (
    <div className="p-[50px]">
      <Heading secondaryPart={appName} className="mb-[20px]" />
      <div className="min-h-[100vh] flex flex-col">
        <div className="flex">
          <div className="flex flex-col mr-[32px] space-y-[31px]">
            <Link to="/add">
              <SelectSquare selected={location.pathname === "/add"}>
                +
              </SelectSquare>
            </Link>
            <Link to="/delete">
              <SelectSquare selected={location.pathname === "/delete"}>
                -
              </SelectSquare>
            </Link>
          </div>
          <Line className="mt-[10px] mr-[32px]" />
          <div>{<Outlet />}</div>
        </div>
      </div>
    </div>
  );
};
