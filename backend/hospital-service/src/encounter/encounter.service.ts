import { HttpException, HttpStatus, Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EncounterEntity } from "../entities/encounter.entity";
import { ReceiveEncounterDto } from "./dto/receiveEncounter.dto";
import axios, { AxiosResponse } from "axios";
import { HttpsClientService } from "../httpsClient/httpsClient.service";

@Injectable()
export class EncounterService {
  private readonly logger = new Logger(EncounterService.name);

  constructor(
    @InjectRepository(EncounterEntity)
    private readonly encounterRepository: Repository<EncounterEntity>,
    private readonly httpsClientService: HttpsClientService,
  ) {}

  async processAndSaveEncounter(
    encounterData: ReceiveEncounterDto,
  ): Promise<EncounterEntity> {
    try {
      this.logger.log("Processing FHIR Encounter data...");

      // Extract data from FHIR format
      const encounterEntity = this.mapFhirToEntity(encounterData);

      // Save to database
      const savedEncounter =
        await this.encounterRepository.save(encounterEntity);

      this.logger.log(
        `Encounter successfully saved with ID: ${savedEncounter.id}`,
      );

      return savedEncounter;
    } catch (error) {
      this.logger.error("Error processing encounter:", error);
      throw error;
    }
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

  public mapEntityToFhir(entity: EncounterEntity): any {
    const reasonCodes = entity.reasonCodes
      ? JSON.parse(entity.reasonCodes)
      : [];

    let fhirData: any;

    if (entity.rawFhirData) {
      fhirData = JSON.parse(entity.rawFhirData);
      fhirData.status = entity.status;
      fhirData.subject.reference = entity.patientReference;
      fhirData.subject.display = entity.patientDisplay;
      fhirData.period.start = entity.periodStart.toISOString();
      fhirData.period.end = entity.periodEnd
        ? entity.periodEnd.toISOString()
        : undefined;
    } else {
      fhirData = {
        resourceType: "Encounter",
        id: entity.fhirId || `encounter-${entity.id}`,
        status: entity.status,
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "AMB",
          display: "ambulatory",
        },
        subject: {
          reference: entity.patientReference,
          display: entity.patientDisplay,
        },
        participant: [
          {
            individual: {
              reference: entity.practitionerReference,
              display: entity.practitionerDisplay,
            },
          },
        ],
        period: {
          start: entity.periodStart.toISOString(),
          end: entity.periodEnd ? entity.periodEnd.toISOString() : undefined,
        },
        meta: {
          lastUpdated: entity.updatedAt.toISOString(),
          versionId: entity.id.toString(),
        },
      };
    }

    if (entity.location) {
      fhirData.location = [
        {
          location: {
            reference: `Location/${entity.location}`,
            display: entity.location,
          },
        },
      ];
    } else {
      delete fhirData.location;
    }

    if (reasonCodes.length > 0) {
      fhirData.reasonCode = reasonCodes.map((code: string) => ({
        coding: [
          {
            system: "http://snomed.info/sct",
            code: code,
            display: this.getReasonDisplay(code),
          },
        ],
      }));
    } else {
      delete fhirData.reasonCode;
    }

    return fhirData;
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

  async getAllEncounters(): Promise<EncounterEntity[]> {
    return this.encounterRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async getEncounterById(id: number): Promise<EncounterEntity> {
    return this.encounterRepository.findOne({ where: { id } });
  }

  async getEncountersByPatient(
    patientReference: string,
  ): Promise<EncounterEntity[]> {
    return this.encounterRepository.find({
      where: { patientReference },
      order: { periodStart: "DESC" },
    });
  }

  async getEncountersByStatus(status: string): Promise<EncounterEntity[]> {
    return this.encounterRepository.find({
      where: { status },
      order: { periodStart: "DESC" },
    });
  }

  public async sendToFhirServer(
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

      if (result.status >= 300 || result.status <= 200) {
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
}
