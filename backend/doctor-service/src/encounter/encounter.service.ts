import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { EncounterEntity } from "../entities/encounter.entity";
import axios, { AxiosResponse } from "axios";
import { EncounterResponseDto } from "./dto/encounterResponse.dto";
import { ReceiveEncounterDto } from "./dto/receiveEncounter.dto";
import { HttpsClientService } from "../httpsClient/httpsClient.service";

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
