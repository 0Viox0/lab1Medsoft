import {
  RegisterVisitForm,
  type VisitData,
} from "@/components/widgets/RegisterVisitForm";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";

export const EditVisit = () => {
  const [searchParams] = useSearchParams();
  const [predefinedData, setPredefinedData] = useState<
    VisitData["patient"] | undefined
  >(undefined);

  useEffect(() => {
    if (
      searchParams.get("patientId") ||
      searchParams.get("patientName") ||
      searchParams.get("patientLastName")
    ) {
      const predefinedData: VisitData["patient"] = {
        display: `${searchParams.get("patientName")} ${searchParams.get("patientLastName")}`,
        reference: `${searchParams.get("patientId")}`,
      };

      setPredefinedData(predefinedData);
    }
  }, [searchParams]);

  return <RegisterVisitForm predefinedVisitData={predefinedData} />;
};
