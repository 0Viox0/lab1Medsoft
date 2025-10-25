import { useState, type FC } from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export type FilterState = {
  name: string;
  lastName: string;
  id: string;
};

export type FilterFormProps = {
  onFilterChange: (filterState: FilterState) => void;
  className?: string;
};

export const FilterForm: FC<FilterFormProps> = ({
  onFilterChange,
  className,
}) => {
  const [filterState, setFilterState] = useState<FilterState>({
    name: "",
    lastName: "",
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
      <div className="text-[1.2rem] mb-[15px]">Сортировать по фильтрам</div>
      <Input
        value={filterState.name}
        placeholder="Имя"
        className="w-[220px]"
        onChange={(event) =>
          handleFilterStateChange("name", event.target.value)
        }
      />
      <Input
        value={filterState.lastName}
        placeholder="Фамилия"
        className="w-[220px]"
        onChange={(event) =>
          handleFilterStateChange("lastName", event.target.value)
        }
      />
      <Input
        value={filterState.id}
        placeholder="ID"
        className="w-[100px]"
        onChange={(event) => handleFilterStateChange("id", event.target.value)}
      />
    </div>
  );
};
