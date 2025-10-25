import { TabName } from "@/components/ui/TabName";
import { EncounterTable } from "@/components/widgets/EncounterTable";
import { FilterForm, type FilterState } from "@/components/widgets/FilterForm";
import { useSocket } from "@/shared/hooks/useSocket";
import { id } from "date-fns/locale";
import { useEffect, useState } from "react";

export const Visits = () => {
  const [patientFilter, setPatientFilter] = useState<FilterState>({
    id: "",
    name: "",
  });
  const [doctorFilter, setDoctorFilter] = useState<FilterState>({
    id: "",
    name: "",
  });

  const { visits, requestAllVisits } = useSocket();

  useEffect(() => {
    requestAllVisits();
  }, [requestAllVisits]);

  const handlePatientFilterChange = (filterState: FilterState) => {
    setPatientFilter(filterState);
  };

  const handleDoctorFilterChange = (filterState: FilterState) => {
    setDoctorFilter(filterState);
  };

  return (
    <>
      <TabName className="mb-[30px]">Список пациентов</TabName>
      <FilterForm
        heading="Фильтры по пациенту"
        fieldNames={{ name: "Имя пациента", id: "id пациента" }}
        onFilterChange={handlePatientFilterChange}
        className="mb-[30px]"
      />
      <FilterForm
        heading="Фильтры по врачу"
        fieldNames={{ name: "Имя врача", id: "id врача" }}
        onFilterChange={handleDoctorFilterChange}
        className="mb-[30px]"
      />
      <EncounterTable
        encounters={visits}
        patientFilter={patientFilter}
        doctorFilter={doctorFilter}
        tableCaption="Список посещений"
      />
    </>
  );
};
