import { TabName } from "@/components/ui/TabName";
import { FilterForm, type FilterState } from "@/components/widgets/FilterForm";
import { PatientTable } from "@/components/widgets/PatientTable";
import { useApi } from "@/shared/hooks/useApi";
import type { PatientWithId } from "@/shared/types";
import { useEffect, useState } from "react";

export const Delete = () => {
  const [patients, setPatients] = useState<PatientWithId[]>([]);
  const [filter, setFilter] = useState<FilterState>({
    id: "",
    lastName: "",
    name: "",
  });

  const api = useApi();

  useEffect(() => {
    const getAllPatients = async () => {
      const patients = await api.getAllPatients();

      setPatients(patients);
    };

    getAllPatients();
  }, []);

  const handleDeleteClick = async (patient: PatientWithId) => {
    await api.deletePatientById(patient.id);
    const newPatientList = await api.getAllPatients();

    setPatients(newPatientList);
  };

  const handleFilterChange = (filterState: FilterState) => {
    setFilter(filterState);
  };

  return (
    <>
      <TabName className="mb-[30px]">Удалить пациента</TabName>
      <FilterForm onFilterChange={handleFilterChange} className="mb-[30px]" />
      <PatientTable
        patients={patients}
        onDeleteClick={handleDeleteClick}
        tableCaption="Таблица пациентов"
        filter={filter}
      />
    </>
  );
};
