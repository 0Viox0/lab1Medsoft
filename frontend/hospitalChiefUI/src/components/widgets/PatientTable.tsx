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
  return (
    <Table className="w-[800px]">
      <TableCaption>{tableCaption}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Имя</TableHead>
          <TableHead>Фамилия</TableHead>
          <TableHead>Дата Рождения</TableHead>
          <TableHead>Id</TableHead>
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
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};
