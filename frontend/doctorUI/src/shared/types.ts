export type Patient = {
  name: string;
  lastName: string;
  dateOfBirth: Date;
};

export type PatientWithId = Patient & { id: string };

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
