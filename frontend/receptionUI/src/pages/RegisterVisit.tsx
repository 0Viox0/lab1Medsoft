import { TabName } from "@/components/ui/TabName";
import { CreateNewVisitButton } from "@/components/widgets/CreateNewVisitButton";
import { EncounterTable } from "@/components/widgets/EncounterTable";
import { PatientSelect } from "@/components/widgets/PatientSelect";
import { RegisterVisitForm } from "@/components/widgets/RegisterVisitForm";
import { useApi } from "@/shared/hooks/useApi";
import type { PatientWithId } from "@/shared/types";
import { useEffect, useState } from "react";

export const RegisterVisit = () => {
  const [patients, setPatients] = useState<PatientWithId[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithId | null>(
    null,
  );

  const api = useApi();

  useEffect(() => {
    const fetchAllPatients = async () => {
      const patients = await api.getAllPatients();

      setPatients(patients);
    };

    fetchAllPatients();
  }, []);

  const handlePatientSelect = (patient: PatientWithId) => {
    setSelectedPatient(patient);
  };

  return (
    <>
      <TabName>Регистрация посещения пациента</TabName>
      <PatientSelect
        patients={patients}
        onPatientSelect={handlePatientSelect}
      />
      {selectedPatient && <CreateNewVisitButton forPatient={selectedPatient} />}
      {selectedPatient && <EncounterTable encounters={[]} />}
    </>
  );
};
