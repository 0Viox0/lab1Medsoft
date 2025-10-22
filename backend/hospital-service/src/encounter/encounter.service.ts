import { Injectable, HttpException, HttpStatus, Logger } from "@nestjs/common";
import axios, { AxiosResponse } from "axios";
import { CreateEncounterDto } from "./dto/createEncounter.dto";
import { firstValueFrom } from "rxjs";
import { HttpsClientService } from "../httpsClient/httpsClient.service";

@Injectable()
export class FhirEncounterService {
  private readonly logger = new Logger(FhirEncounterService.name);

  constructor(private readonly httpsClientService: HttpsClientService) {}

  // Основной FHIR сервер (где хранятся данные)
  private readonly primaryFhirServer =
    process.env.PRIMARY_FHIR_SERVER || "http://localhost:8080/fhir";

  // Внешний сервис для отправки данных
  private readonly externalFhirService =
    process.env.EXTERNAL_FHIR_SERVICE || "http://external-service/fhir";

  /**
   * Создает запись о посещении в FHIR формате
   */
  async createEncounter(createEncounterDto: CreateEncounterDto): Promise<any> {
    try {
      // Преобразуем DTO в FHIR Encounter ресурс
      const fhirEncounter = this.mapToFhirEncounter(createEncounterDto);

      this.logger.log("Creating FHIR Encounter...");

      // Отправляем в основной FHIR сервер
      const primaryResponse = await this.sendToFhirServer(
        fhirEncounter,
        this.primaryFhirServer,
      );

      // Отправляем во внешний сервис
      await this.sendToExternalService(fhirEncounter);

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

  /**
   * Преобразует DTO в FHIR Encounter ресурс
   */
  private mapToFhirEncounter(dto: CreateEncounterDto): any {
    const encounter = {
      resourceType: "Encounter",
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

    // Добавляем локацию если указана
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

    // Добавляем причины посещения если указаны
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

  /**
   * Отправляет данные в FHIR сервер
   */
  private async sendToFhirServer(
    fhirEncounter: any,
    serverUrl: string,
  ): Promise<AxiosResponse> {
    try {
      const httpsAgent = this.httpsClientService.getHttpsAgent();

      const result = await axios.post(`${serverUrl}/Encounter`, fhirEncounter, {
        headers: {
          "Content-Type": "application/fhir+json",
          httpsAgent,
        },
      });

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
   * Отправляет данные во внешний сервис
   */
  private async sendToExternalService(fhirEncounter: any): Promise<void> {
    try {
      const httpsAgent = this.httpsClientService.getHttpsAgent();

      const result = await axios.post(
        `${this.externalFhirService}/Encounter`,
        fhirEncounter,
        {
          headers: {
            "Content-Type": "application/fhir+json",
          },
          timeout: 10000, // 10 секунд таймаут
          httpsAgent,
        },
      );

      this.logger.log("Data successfully sent to external service");

      return result.data;
    } catch (error) {
      // Логируем ошибку, но не прерываем основной поток
      this.logger.error(
        "Error sending to external service:",
        error.response?.data || error.message,
      );
      // Можно добавить логику повторной отправки или очередь сообщений
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

  /**
   * Получает запись о посещении по ID
   */
  async getEncounter(encounterId: string): Promise<any> {
    try {
      const httpsAgent = this.httpsClientService.getHttpsAgent();

      const response = await axios.get(
        `${this.primaryFhirServer}/Encounter/${encounterId}`,
        {
          headers: {
            "Content-Type": "application/fhir+json",
            httpsAgent,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error getting encounter ${encounterId}:`, error);
      throw new HttpException(
        `Encounter not found: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Ищет посещения по пациенту
   */
  async findEncountersByPatient(patientId: string): Promise<any> {
    try {
      const httpsAgent = this.httpsClientService.getHttpsAgent();

      const response = await axios.get(
        `${this.primaryFhirServer}/Encounter?patient=${patientId}&_sort=-date`,
        {
          headers: {
            "Content-Type": "application/fhir+json",
            httpsAgent,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error finding encounters for patient ${patientId}:`,
        error,
      );
      throw new HttpException(
        `Error searching encounters: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
