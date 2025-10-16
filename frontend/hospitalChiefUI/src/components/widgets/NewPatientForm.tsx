import { useState, type FC } from "react";
import { DatePicker } from "../ui/DatePicker";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

export type NewPatientFormState = {
  name: string;
  lastName: string;
  date: Date | undefined;
};

export type NewPationFormProps = {
  onSubmit: (patientInfo: NewPatientFormState) => void;
};

export const NewPatientForm: FC<NewPationFormProps> = ({ onSubmit }) => {
  const [patientInfo, setPatientInfo] = useState<NewPatientFormState>({
    name: "",
    lastName: "",
    date: undefined,
  });

  const handleFormChange = <T extends keyof NewPatientFormState>(
    field: T,
    newValue: NewPatientFormState[T] | undefined,
  ) => {
    setPatientInfo((prevState) => ({ ...prevState, [field]: newValue }));
  };

  return (
    <div className="flex flex-col space-y-[30px]">
      <Input
        value={patientInfo.name}
        placeholder="Имя"
        onChange={(event) => handleFormChange("name", event.target.value)}
      />
      <Input
        placeholder="Фамилия"
        onChange={(event) => handleFormChange("lastName", event.target.value)}
      />
      <DatePicker
        label="Дата рождения"
        onChange={(date) => handleFormChange("date", date)}
      />
      <Button className="w-[100px]" onClick={() => onSubmit(patientInfo)}>
        Создать
      </Button>
    </div>
  );
};
