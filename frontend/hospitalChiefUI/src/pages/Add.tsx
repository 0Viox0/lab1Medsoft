import { TabName } from "@/components/ui/TabName";
import {
  NewPatientForm,
  type NewPatientFormState,
} from "@/components/widgets/NewPatientForm";
import { toPatient } from "@/lib/converters";
import { useApi } from "@/shared/hooks/useApi";

export const Add = () => {
  const api = useApi();

  const handleSubmit = (patientInfo: NewPatientFormState) => {
    api.createPatient(toPatient(patientInfo));
  };

  return (
    <>
      <TabName className="mb-[30px]">Добавить пациента</TabName>
      <NewPatientForm onSubmit={handleSubmit} />
    </>
  );
};
