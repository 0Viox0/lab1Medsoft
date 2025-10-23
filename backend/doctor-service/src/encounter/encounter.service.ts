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
