import type { Patient, PatientWithId } from "@/shared/types";

const BASE_URL = "https://localhost:3000";
const PATH = "/patients";

const url = BASE_URL + PATH;

export const createApi = () => {
  return { createPatient, deletePatientById, getAllPatients };
};

const createPatient = async (patient: Patient) => {
  await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: patient.name,
      lastName: patient.lastName,
      birthDate: patient.dateOfBirth,
    }),
  });
};

const deletePatientById = async (id: string) => {
  await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: id }),
  });
};

export type BackendPacientResponse = {
  birthDate: string;
  createdAt: string;
  firstName: string;
  id: string;
  lastName: string;
};

const getAllPatients = async (): Promise<PatientWithId[] | []> => {
  const response = await fetch(url);

  if (response.ok) {
    const result = (await response.json()) as BackendPacientResponse[];

    return result.map((item) => ({
      id: item.id,
      name: item.firstName,
      lastName: item.lastName,
      dateOfBirth: new Date(item.birthDate),
    }));
  }

  return [];
};
