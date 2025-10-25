import { TabName } from "@/components/ui/TabName";
import { CreateNewVisitButton } from "@/components/widgets/CreateNewVisitButton";
import { EncounterTable } from "@/components/widgets/EncounterTable";
import { PatientSelect } from "@/components/widgets/PatientSelect";
import { RegisterVisitForm } from "@/components/widgets/RegisterVisitForm";
import { useApi } from "@/shared/hooks/useApi";
import type { EncounterResponseDto, PatientWithId } from "@/shared/types";
import { useEffect, useState } from "react";

export const RegisterVisit = () => {
  const [patients, setPatients] = useState<PatientWithId[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithId | null>(
    null,
  );
  const [patientEncounters, setPatientEncounters] = useState<
    EncounterResponseDto[]
  >([]);

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

  useEffect(() => {
    const fetchPatientEncounters = async () => {
      const encounters = await api.getEncoutners();
      setPatientEncounters(
        encounters.filter(
          (encounter) => encounter.patient.reference === selectedPatient?.id,
        ),
      );
    };

    if (selectedPatient) {
      fetchPatientEncounters();
    }
  }, [selectedPatient]);

  return (
    <>
      <TabName>Регистрация посещения пациента</TabName>
      <PatientSelect
        patients={patients}
        onPatientSelect={handlePatientSelect}
      />
      {selectedPatient && <CreateNewVisitButton forPatient={selectedPatient} />}
      {selectedPatient && <EncounterTable encounters={patientEncounters} />}
    </>
  );
};
