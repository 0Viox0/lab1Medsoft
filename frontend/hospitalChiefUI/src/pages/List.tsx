import { TabName } from "@/components/ui/TabName";
import { FilterForm, type FilterState } from "@/components/widgets/FilterForm";
import { PatientTable } from "@/components/widgets/PatientTable";
import { useSocket } from "@/shared/hooks/useSocket";
import { useEffect, useState } from "react";

export const List = () => {
  const [filter, setFilter] = useState<FilterState>({
    id: "",
    lastName: "",
    name: "",
  });

  const { last10Data, requestAllPatients } = useSocket();

  useEffect(() => {
    requestAllPatients();
  }, [requestAllPatients]);

  const handleFilterChange = (filterState: FilterState) => {
    setFilter(filterState);
  };

  return (
    <>
      <TabName className="mb-[30px]">Список пациентов</TabName>
      <FilterForm onFilterChange={handleFilterChange} className="mb-[30px]" />
      <PatientTable
        patients={last10Data}
        tableCaption="Таблица пациентов"
        filter={filter}
      />
    </>
  );
};
