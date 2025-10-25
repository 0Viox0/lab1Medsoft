import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { FC } from "react";
import type { PatientWithId } from "@/shared/types";
import type { FilterState } from "./FilterForm";

export type TableDemoProps = {
  tableCaption?: string;
  patients: PatientWithId[];
  filter?: FilterState;
};

export const PatientTable: FC<TableDemoProps> = ({
  tableCaption,
  patients,
  filter,
}) => {
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      planned: "Запланирован",
      "in-progress": "В процессе",
      finished: "Завершен",
      cancelled: "Отменен",
      unknown: "Неизвестен",
    };
    return statusMap[status] || status;
  };

  return (
    <Table className="w-[800px]">
      <TableCaption>{tableCaption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Имя</TableHead>
          <TableHead>Фамилия</TableHead>
          <TableHead>Дата Рождения</TableHead>
          <TableHead>Id</TableHead>
          <TableHead>Статус посещений</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients
          .filter(
            (patient) =>
              filter &&
              patient?.id.toLowerCase().includes(filter.id.toLowerCase()) &&
              patient?.name.toLowerCase().includes(filter.name.toLowerCase()) &&
              patient?.lastName
                .toLowerCase()
                .includes(filter?.lastName.toLowerCase()),
          )
          .map((patient) => (
            <TableRow key={patient?.id}>
              <TableCell className="font-medium">{patient?.name}</TableCell>
              <TableCell>{patient?.lastName}</TableCell>
              <TableCell>
                {patient?.dateOfBirth?.toLocaleDateString("ru-RU")}
              </TableCell>
              <TableCell>{patient?.id}</TableCell>
              <TableCell>
                {patient?.visitStatuses.map((status, index) => (
                  <span
                    key={index}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-2 ${
                      status === "finished"
                        ? "bg-green-100 text-green-800"
                        : status === "in-progress"
                          ? "bg-blue-100 text-blue-800"
                          : status === "planned"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {getStatusText(status)}
                  </span>
                ))}
                {patient?.visitStatuses.length === 0 && "Нет посещений"}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};
