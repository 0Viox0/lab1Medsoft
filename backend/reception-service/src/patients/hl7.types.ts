export type HL7Action = "CREATE" | "DELETE" | "GET";

export interface HL7Payload {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  id?: string;
  action: HL7Action;
}

export const HL7_CONFIG = {
  SENDING_APPLICATION: "Reception",
  SENDING_FACILITY: "FrontDesk",
  RECEIVING_APPLICATION: "HospitalSystem",
  RECEIVING_FACILITY: "Main",
} as const;
