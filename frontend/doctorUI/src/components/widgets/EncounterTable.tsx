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
import type { EncounterResponseDto } from "@/shared/types";
import type { FilterState } from "./FilterForm";
import { ChangeVisitButton } from "./ChangeVisitButton";

export type EncounterTableProps = {
  tableCaption?: string;
  encounters: EncounterResponseDto[];
  patientFilter: FilterState;
  doctorFilter: FilterState;
};

export const EncounterTable: FC<EncounterTableProps> = ({
  tableCaption,
  encounters,
  patientFilter,
  doctorFilter,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU");
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const filteredEncounters = encounters.filter((encounter) => {
    if (!patientFilter && !doctorFilter) return true;

    const matchesPatientId = patientFilter
      ? encounter.patient.reference
          .toLowerCase()
          .includes(patientFilter.id.toLowerCase())
      : true;
    const matchesPatientName = patientFilter
      ? encounter.patient.display
          .toLowerCase()
          .includes(patientFilter.name.toLowerCase())
      : true;

    const matchesDoctortId = doctorFilter
      ? encounter.practitioner.reference
          .toLowerCase()
          .includes(doctorFilter.id.toLowerCase())
      : true;
    const matchesDoctorName = doctorFilter
      ? encounter.practitioner.display
          .toLowerCase()
          .includes(doctorFilter.name.toLowerCase())
      : true;

    return (
      matchesPatientId &&
      matchesPatientName &&
      matchesDoctortId &&
      matchesDoctorName
    );
  });

  return (
    <Table className="w-full">
      <TableCaption>
        {tableCaption || "Список посещений пациентов"}
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">Статус</TableHead>
          <TableHead className="w-[150px]">Пациент</TableHead>
          <TableHead className="w-[150px]">Врач</TableHead>
          <TableHead className="w-[120px]">Дата</TableHead>
          <TableHead className="w-[100px]">Время</TableHead>
          <TableHead className="w-[100px]">Локация</TableHead>
          <TableHead>Причины</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredEncounters.map((encounter) => (
          <TableRow
            key={`${encounter.patient.reference}${encounter.practitioner.reference}${encounter.period.start}`}
          >
            <TableCell>
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  encounter.status === "finished"
                    ? "bg-green-100 text-green-800"
                    : encounter.status === "in-progress"
                      ? "bg-blue-100 text-blue-800"
                      : encounter.status === "planned"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {getStatusText(encounter.status)}
              </span>
            </TableCell>
            <TableCell className="font-medium">
              <div>
                <div className="font-semibold">{encounter.patient.display}</div>
                <div className="text-xs text-muted-foreground">
                  {encounter.patient.reference}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-semibold">
                  {encounter.practitioner.display}
                </div>
                <div className="text-xs text-muted-foreground">
                  {encounter.practitioner.reference}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div>{formatDate(encounter.period.start)}</div>
              {encounter.period.end && (
                <div className="text-xs text-muted-foreground">
                  - {formatDate(encounter.period.end)}
                </div>
              )}
            </TableCell>
            <TableCell>
              <div>
                <div>{formatTime(encounter.period.start)}</div>
                {encounter.period.end && (
                  <div className="text-xs text-muted-foreground">
                    - {formatTime(encounter.period.end)}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>{encounter.location || "-"}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {encounter.reasonCodes.length > 0 ? (
                  encounter.reasonCodes.slice(0, 2).map((code, index) => (
                    <span
                      key={index}
                      className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                    >
                      {code}
                    </span>
                  ))
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
                {encounter.reasonCodes.length > 2 && (
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    +{encounter.reasonCodes.length - 2}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell>
              <ChangeVisitButton forEncounter={encounter} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
