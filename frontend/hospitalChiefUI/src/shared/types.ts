export type Patient = {
  name: string;
  lastName: string;
  dateOfBirth: Date;
};

export type PatientWithId = Patient & { id: string };
