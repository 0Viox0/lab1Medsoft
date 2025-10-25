import type { VisitData } from "@/components/widgets/RegisterVisitForm";
import type {
  EncounterResponseDto,
  Patient,
  PatientWithId,
} from "@/shared/types";

const BASE_URL = "https://localhost:3000";

const patientsUrl = BASE_URL + "/patients";
const registerVisitUrl = BASE_URL + "/encounters";

export const createApi = () => {
  return {
    createPatient,
    deletePatientById,
    getAllPatients,
    registerVisit,
    getEncoutners,
  };
};

const createPatient = async (patient: Patient) => {
  await fetch(patientsUrl, {
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
  await fetch(patientsUrl, {
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
  const response = await fetch(patientsUrl);

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

type RegisterVisitResult = {
  ok: boolean;
  message: string;
};

const registerVisit = async (
  visitData: VisitData,
): Promise<RegisterVisitResult> => {
  const response = await fetch(registerVisitUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(visitData),
  });

  if (response.ok) {
    return { ok: true, message: "Посещение успешно зарегистрировано!" };
  }

  const errorData = await response.json();
  const message = `Ошибка: ${errorData.message || "Неизвестная ошибка"}`;

  return { ok: false, message };
};

const getEncoutners = async (): Promise<EncounterResponseDto[]> => {
  const response = await fetch(registerVisitUrl);

  if (response.ok) {
    const data = await response.json();
    return data;
  }

  return [];
};
