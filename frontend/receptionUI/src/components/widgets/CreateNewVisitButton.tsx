import { Link } from "react-router";
import { Button } from "../ui/button";
import type { PatientWithId } from "@/shared/types";
import type { FC } from "react";

export type CreateNewVisitButtonProps = {
  forPatient: PatientWithId;
};

export const CreateNewVisitButton: FC<CreateNewVisitButtonProps> = ({
  forPatient,
}) => {
  return (
    <Link
      to={`/editVisit?patientId=${forPatient.id}&patientName=${forPatient.name}&patientLastName=${forPatient.lastName}`}
    >
      <Button className="mt-7">Создать ноовое посещение</Button>
    </Link>
  );
};
