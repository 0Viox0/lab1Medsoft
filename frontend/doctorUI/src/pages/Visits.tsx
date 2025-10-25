import { TabName } from "@/components/ui/TabName";
import { EncounterTable } from "@/components/widgets/EncounterTable";
import { FilterForm, type FilterState } from "@/components/widgets/FilterForm";
import { useSocket } from "@/shared/hooks/useSocket";
import { useEffect, useState } from "react";

export const Visits = () => {
  const [filter, setFilter] = useState<FilterState>({
    id: "",
    lastName: "",
    name: "",
  });

  const { visits, requestAllVisits } = useSocket();

  useEffect(() => {
    requestAllVisits();
  }, [requestAllVisits]);

  const handleFilterChange = (filterState: FilterState) => {
    setFilter(filterState);
  };

  return (
    <>
      <TabName className="mb-[30px]">Список пациентов</TabName>
      <FilterForm onFilterChange={handleFilterChange} className="mb-[30px]" />
      <EncounterTable
        encounters={visits}
        filter={filter}
        tableCaption="Список посещений"
      />
    </>
  );
};
