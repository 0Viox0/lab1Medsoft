import { useState, type FC } from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export type FilterState = {
  name: string;
  id: string;
};

export type FilterFormProps = {
  heading?: string;
  fieldNames?: {
    name: string;
    id: string;
  };
  onFilterChange: (filterState: FilterState) => void;
  className?: string;
};

export const FilterForm: FC<FilterFormProps> = ({
  heading = "Сортировать по фильтрам",
  fieldNames = {
    id: "Id",
    name: "Имя",
  },
  onFilterChange,
  className,
}) => {
  const [filterState, setFilterState] = useState<FilterState>({
    name: "",
    id: "",
  });

  const handleFilterStateChange = <T extends keyof FilterState>(
    field: T,
    value: FilterState[T],
  ) => {
    setFilterState((prevState) => {
      const newState = { ...prevState, [field]: value };

      onFilterChange(newState);

      return newState;
    });
  };

  return (
    <div className={cn("space-x-[20px]", className)}>
      <div className="text-[1.2rem] mb-[15px]">{heading}</div>
      <Input
        value={filterState.name}
        placeholder={fieldNames.name}
        className="w-[300px]"
        onChange={(event) =>
          handleFilterStateChange("name", event.target.value)
        }
      />
      <Input
        value={filterState.id}
        placeholder={fieldNames.id}
        className="w-[300px]"
        onChange={(event) => handleFilterStateChange("id", event.target.value)}
      />
    </div>
  );
};
