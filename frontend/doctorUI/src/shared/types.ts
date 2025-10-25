export type EncounterResponseDto = {
  id: string;
  status: string;
  patient: {
    reference: string;
    display: string;
  };
  practitioner: {
    reference: string;
    display: string;
  };
  period: {
    start: string;
    end?: string;
  };
  location?: string;
  reasonCodes: string[];
  lastUpdated: string;
};
