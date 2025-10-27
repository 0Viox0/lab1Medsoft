import {
  RegisterVisitForm,
  type VisitData,
} from "@/components/widgets/RegisterVisitForm";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

export const EditVisit = () => {
  const [searchParams] = useSearchParams();
  const [predefinedData, setPredefinedData] = useState<Partial<VisitData>>({});

  useEffect(() => {
    if (
      searchParams.get("patientId") ||
      searchParams.get("patientName") ||
      searchParams.get("patientLastName") ||
      // new below
      searchParams.get("doctorId") ||
      searchParams.get("doctorName") ||
      searchParams.get("status") ||
      searchParams.get("startDateTime") ||
      searchParams.get("endDateTime") ||
      searchParams.get("location") ||
      searchParams.get("codes")
    ) {
      const isoToDatetimeLocal = (isoString: string): string => {
        if (!isoString) return "";
        return isoString.slice(0, 16);
      };

      const predefinedData: Partial<VisitData> = {
        patient: {
          display: `${searchParams.get("patientName") ?? ""} ${searchParams.get("patientLastName") ?? ""}`,
          reference: `${searchParams.get("patientId") ?? ""}`,
        },
        practitioner: {
          display: `${searchParams.get("doctorName") ?? ""}`,
          reference: `${searchParams.get("doctorId") ?? ""}`,
        },
        status: `${searchParams.get("status") ?? "planned"}`,
        periodStart: isoToDatetimeLocal(
          `${searchParams.get("startDateTime") ?? ""}`,
        ),
        periodEnd: isoToDatetimeLocal(
          `${searchParams.get("endDateTime") ?? ""}`,
        ),
        location: `${searchParams.get("location") ?? ""}`,
        reasonCodes: `${searchParams.get("codes") ?? ""}`.split(", "),
      };

      setPredefinedData(predefinedData);
    }
  }, [searchParams]);

  return <RegisterVisitForm predefinedVisitData={predefinedData} />;
};
