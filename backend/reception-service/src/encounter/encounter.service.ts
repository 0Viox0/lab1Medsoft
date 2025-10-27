import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import axios, { AxiosResponse } from "axios";
import { CreateEncounterDto } from "./dto/createEncounter.dto";
import { HttpsClientService } from "../httpsClient/httpsClient.service";
import { EncounterResponseDto } from "./dto/encounterResponse.dto";

@Injectable()
export class FhirEncounterService {
  private readonly logger = new Logger(FhirEncounterService.name);

  constructor(private readonly httpsClientService: HttpsClientService) {}

  private readonly primaryFhirServer = "https://localhost:3001";

  public async createEncounter(
    createEncounterDto: CreateEncounterDto,
  ): Promise<any> {
    try {
      const fhirEncounter = this.mapToFhirEncounter(createEncounterDto);

      this.logger.log("Creating FHIR Encounter...", fhirEncounter);

      const primaryResponse = await this.sendToFhirServer(
        fhirEncounter,
        this.primaryFhirServer,
      );

      this.logger.log(
        "Encounter successfully created and sent to external service",
      );

      return primaryResponse.data;
    } catch (error) {
      this.logger.error("Error creating encounter:", error);
      throw new HttpException(
        `Failed to create encounter: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async editEncounter(
    createEncounterDto: CreateEncounterDto & { id: string },
  ): Promise<any> {
    try {
      const fhirEncounter = this.mapToFhirEncounter(createEncounterDto);

      this.logger.log("Editing FHIR Encounter...", fhirEncounter);

      const primaryResponse = await this.sendPatchToFhirServer(
        fhirEncounter,
        this.primaryFhirServer,
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

  public async getEncounters() {
    const response = await this.requestEncountersFromHospital();

    const visits = (response.data as unknown[]).map(
      this.mapHospitalToResponseDto,
    );

    this.logger.log("received visits: ", visits);

    return visits;
  }

  private mapHospitalToResponseDto(hospitalData: any): EncounterResponseDto {
    // Извлекаем reason codes из FHIR формата
    const reasonCodes =
      hospitalData.reasonCode
        ?.map((reason: any) => reason.coding?.[0]?.code)
        .filter(Boolean) || [];

    // Извлекаем location
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

  private async requestEncountersFromHospital() {
    const agent = this.httpsClientService.getHttpsAgent();

    const response = await axios.get(`${this.primaryFhirServer}/encounters`, {
      httpsAgent: agent,
    });

    if (response.status > 300 || response.status < 200) {
      throw new HttpException(
        `Failed to fetch encounter: ${response.statusText}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return response.data;
  }

  /**
   * Преобразует DTO в FHIR Encounter ресурс
   */
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

  private async sendToFhirServer(
    fhirEncounter: any,
    serverUrl: string,
  ): Promise<AxiosResponse> {
    try {
      const httpsAgent = this.httpsClientService.getHttpsAgent();

      const result = await axios.post(
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

  /**
   * Получает отображаемое название для кода причины
   */
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

  // /**
  //  * Получает запись о посещении по ID
  //  */
  // async getEncounter(encounterId: string): Promise<any> {
  //   try {
  //     const httpsAgent = this.httpsClientService.getHttpsAgent();
  //
  //     const response = await axios.get(
  //       `${this.primaryFhirServer}/Encounter/${encounterId}`,
  //       {
  //         headers: {
  //           "Content-Type": "application/fhir+json",
  //           httpsAgent,
  //         },
  //       },
  //     );
  //
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error(`Error getting encounter ${encounterId}:`, error);
  //     throw new HttpException(
  //       `Encounter not found: ${error.message}`,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  // }

  // /**
  //  * Ищет посещения по пациенту
  //  */
  // async findEncountersByPatient(patientId: string): Promise<any> {
  //   try {
  //     const httpsAgent = this.httpsClientService.getHttpsAgent();
  //
  //     const response = await axios.get(
  //       `${this.primaryFhirServer}/Encounter?patient=${patientId}&_sort=-date`,
  //       {
  //         headers: {
  //           "Content-Type": "application/fhir+json",
  //           httpsAgent,
  //         },
  //       },
  //     );
  //
  //     return response.data;
  //   } catch (error) {
  //     this.logger.error(
  //       `Error finding encounters for patient ${patientId}:`,
  //       error,
  //     );
  //     throw new HttpException(
  //       `Error searching encounters: ${error.message}`,
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
}
