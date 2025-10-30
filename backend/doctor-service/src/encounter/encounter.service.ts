import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { EncounterEntity } from "../entities/encounter.entity";
import axios, { AxiosResponse } from "axios";
import { EncounterResponseDto } from "./dto/encounterResponse.dto";
import { ReceiveEncounterDto } from "./dto/receiveEncounter.dto";
import { HttpsClientService } from "../httpsClient/httpsClient.service";
import {CreateEncounterDto} from "./dto/createEncounter.dto";

@Injectable()
export class EncounterService {
  private readonly logger = new Logger(EncounterService.name);
  private readonly hospitalUrl = "https://localhost:3001";

  constructor(private readonly httpsClientService: HttpsClientService) {}

  async getAllEncounters(): Promise<EncounterResponseDto[]> {
    const response = await this.requestVisitsFromHospital(this.hospitalUrl);

    const visits = (response.data as unknown[]).map(
      this.mapHospitalToResponseDto,
    );

    this.logger.log("received visits: ", visits);

    return visits;
  }

  private mapFhirToEntity(
    fhirData: ReceiveEncounterDto,
  ): Partial<EncounterEntity> {
    // Extract reason codes
    const reasonCodes =
      fhirData.reasonCode
        ?.map((reason) => reason.coding?.[0]?.code)
        .filter(Boolean) || [];

    // Extract location
    const location =
      fhirData.location?.[0]?.location?.reference?.replace("Location/", "") ||
      fhirData.location?.[0]?.location?.display;

    const entity: Partial<EncounterEntity> = {
      status: fhirData.status,
      patientReference: fhirData.subject.reference,
      patientDisplay: fhirData.subject.display,
      practitionerReference: fhirData.participant[0]?.individual.reference,
      practitionerDisplay: fhirData.participant[0]?.individual.display,
      periodStart: new Date(fhirData.period.start),
      periodEnd: fhirData.period.end ? new Date(fhirData.period.end) : null,
      location: location,
      reasonCodes: reasonCodes.length > 0 ? JSON.stringify(reasonCodes) : null,
      rawFhirData: JSON.stringify(fhirData),
    };

    return entity;
  }

  private mapHospitalToResponseDto(hospitalData: any): EncounterResponseDto {
    const reasonCodes =
      hospitalData.reasonCode
        ?.map((reason: any) => reason.coding?.[0]?.code)
        .filter(Boolean) || [];

    const location =
      hospitalData.location?.[0]?.location?.display ||
      hospitalData.location?.[0]?.location?.reference?.replace("Location/", "");

    return {
      id: hospitalData.id || `encounter-${hospitalData.meta?.versionId}`,
      status: hospitalData.status,
      patient: {
        reference: hospitalData.subject?.reference,
        display: hospitalData.subject?.display,
      },
      practitioner: {
        reference: hospitalData.participant?.[0]?.individual?.reference,
        display: hospitalData.participant?.[0]?.individual?.display,
      },
      period: {
        start: hospitalData.period?.start,
        end: hospitalData.period?.end,
      },
      location: location,
      reasonCodes: reasonCodes,
      lastUpdated: hospitalData.meta?.lastUpdated || new Date().toISOString(),
    };
  }

    public async editEncounter(
        createEncounterDto: CreateEncounterDto & { id: string },
    ): Promise<any> {
        try {
            const fhirEncounter = this.mapToFhirEncounter(createEncounterDto);

            this.logger.log("Editing FHIR Encounter...", fhirEncounter);

            const primaryResponse = await this.sendPatchToFhirServer(
                fhirEncounter,
                this.hospitalUrl,
            );

            this.logger.log(
                "Encounter successfully edited and sent to external service",
            );

            return primaryResponse.data;
        } catch (error) {
            this.logger.error("Error editing encounter:", error);
            throw new HttpException(
                `Failed to editing encounter: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    private async sendPatchToFhirServer(
        fhirEncounter: any,
        serverUrl: string,
    ): Promise<AxiosResponse> {
        try {
            const httpsAgent = this.httpsClientService.getHttpsAgent();

            console.log("WHAT WE ARE SENDING:");

            const result = await axios.patch(
                `${serverUrl}/encounters`,
                fhirEncounter,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    httpsAgent: httpsAgent,
                },
            );

            if (result.status >= 300 || result.status < 200) {
                throw new HttpException(
                    `Failed to create encounter: ${result.statusText}`,
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }

            return result.data;
        } catch (error) {
            this.logger.error(
                `Error sending to FHIR server ${serverUrl}:`,
                error.response?.data || error.message,
            );
            throw error;
        }
    }

    private mapToFhirEncounter(
        dto: Partial<CreateEncounterDto & { id: string }>,
    ): any {
        const encounter = {
            resourceType: "Encounter",
            id: dto.id,
            status: dto.status,
            class: {
                system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                code: "AMB",
                display: "ambulatory",
            },
            subject: {
                reference: dto.patient.reference,
                display: dto.patient.display,
            },
            participant: [
                {
                    individual: {
                        reference: dto.practitioner.reference,
                        display: dto.practitioner.display,
                    },
                },
            ],
            period: {
                start: dto.periodStart,
                end: dto.periodEnd || new Date().toISOString(),
            },
        };

        if (dto.location) {
            encounter["location"] = [
                {
                    location: {
                        reference: `Location/${dto.location}`,
                        display: dto.location,
                    },
                },
            ];
        }

        if (dto.reasonCodes && dto.reasonCodes.length > 0) {
            encounter["reasonCode"] = dto.reasonCodes.map((code) => ({
                coding: [
                    {
                        system: "http://snomed.info/sct",
                        code: code,
                        display: this.getReasonDisplay(code),
                    },
                ],
            }));
        }

        return encounter;
    }

    private getReasonDisplay(code: string): string {
        const reasonMap = {
            "185349003": "Follow-up visit",
            "270427003": "Patient-initiated encounter",
            "308335008": "Patient visit",
            "390906007": "Follow-up encounter",
            "185317003": "Visit for check-up",
        };

        return reasonMap[code] || "Medical encounter";
    }

    public async requestVisitsFromHospital(
    serverUrl: string,
  ): Promise<AxiosResponse> {
    try {
      const httpsAgent = this.httpsClientService.getHttpsAgent();

      const result = await axios.get(`${serverUrl}/encounters`, {
        httpsAgent: httpsAgent,
      });

      if (result.status > 300 || result.status < 200) {
        throw new HttpException(
          `Failed to fetch encounter: ${result.statusText}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return result.data;
    } catch (error) {
      this.logger.error(
        `Error getting visits from ${serverUrl}:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  }
}
