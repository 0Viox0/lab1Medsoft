import type { NewPatientFormState } from "@/components/widgets/NewPatientForm";
import type { Patient } from "@/shared/types";

export const toPatient = (patient: NewPatientFormState): Patient => {
  return {
    name: patient.name,
    lastName: patient.lastName,
    dateOfBirth: patient.date || new Date(),
  };
};
