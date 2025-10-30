import type { VisitData } from "@/components/widgets/RegisterVisitForm";
import type { Patient, PatientWithId } from "@/shared/types";

const BASE_URL = "https://localhost:3002";
const PATH = "/patients";

const url = BASE_URL + PATH;
const registerVisitUrl = BASE_URL + "/encounters";

export const createApi = () => {
  return { createPatient, deletePatientById, getAllPatients, changeVisit };
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

export type RegisterVisitResult = {
  ok: boolean;
  message: string;
};

const changeVisit = async (
  visitData: VisitData & { id: string },
): Promise<RegisterVisitResult> => {
  const response = await fetch(registerVisitUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(visitData),
  });

  if (response.ok) {
    return { ok: true, message: "Посещение успешно заменено!" };
  }

  const errorData = await response.json();
  const message = `Ошибка: ${errorData.message || "Неизвестная ошибка"}`;

  return { ok: false, message };
};
