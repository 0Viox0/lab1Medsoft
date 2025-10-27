import { Link } from "react-router";
import { Button } from "../ui/button";
import type { EncounterResponseDto } from "@/shared/types";
import type { FC } from "react";

export type ChangeVisitButtonProps = {
  forEncounter: EncounterResponseDto;
};

export const ChangeVisitButton: FC<ChangeVisitButtonProps> = ({
  forEncounter,
}) => {
  return (
    <Link
      to={`/editVisit?patientId=${forEncounter.patient.reference}&patientName=${forEncounter.patient.display}&doctorId=${forEncounter.practitioner.reference}&doctorName=${forEncounter.practitioner.display}&status=${forEncounter.status}&startDateTime=${forEncounter.period.start}&endDateTime=${forEncounter.period.end}&location=${forEncounter.location}&codes=${forEncounter.reasonCodes}&edit=true&encounterId=${forEncounter.id}`}
    >
      <Button size="sm" className="bg-orange-200 hover:bg-orange-500">
        Редактировать
      </Button>
    </Link>
  );
};
