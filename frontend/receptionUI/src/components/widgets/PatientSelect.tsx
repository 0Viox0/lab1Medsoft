import type { PatientWithId } from "@/shared/types";
import type { FC } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type PatientSelectProps = {
  patients: PatientWithId[];
  onPatientSelect: (patient: PatientWithId) => void;
  placeholder?: string;
};

export const PatientSelect: FC<PatientSelectProps> = ({
  patients,
  onPatientSelect,
  placeholder = "Выберите пациента",
}) => {
  const handleValueChange = (patientId: string) => {
    const selectedPatient = patients.find(
      (patient) => patient.id === patientId,
    );
    if (selectedPatient) {
      onPatientSelect(selectedPatient);
    }
  };

  return (
    <Select onValueChange={handleValueChange}>
      <SelectTrigger className="w-[220px] mt-7 hover:cursor-pointer">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="dark">
        <SelectGroup>
          <SelectLabel>Patients</SelectLabel>
          {patients.map((patient) => (
            <SelectItem
              key={patient.id}
              value={patient.id}
              className="hover:cursor-pointer"
            >
              {patient.name} {patient.lastName}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
