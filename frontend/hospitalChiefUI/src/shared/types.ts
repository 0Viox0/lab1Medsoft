export type Patient = {
  name: string;
  lastName: string;
  dateOfBirth: Date;
  visitStatuses: string[];
};

export type PatientWithId = Patient & { id: string };
