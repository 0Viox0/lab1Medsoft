import {
  Controller,
  Post,
  Body,
  HttpStatus,
  ValidationPipe,
  InternalServerErrorException,
  Get,
  Logger,
  Patch,
} from "@nestjs/common";
import { EncounterService } from "./encounter.service";
import { FhirEncounterDto } from "./dto/receiveEncounter.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Controller("encounters")
export class EncounterReceiverController {
  private serverURl = "https://localhost:3002";
  private readonly logger = new Logger(EncounterReceiverController.name);

  constructor(
    private readonly encounterService: EncounterService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  async receiveEncounter(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    encounterData: FhirEncounterDto,
  ) {
    try {
      await this.encounterService.sendToFhirServer(
        encounterData,
        this.serverURl,
      );

      const savedEncounter =
        await this.encounterService.processAndSaveEncounter(
          encounterData as FhirEncounterDto,
        );

      this.eventEmitter.emit("patients.updated");

      return {
        statusCode: HttpStatus.CREATED,
        message: "Encounter successfully received and saved",
        data: {
          id: savedEncounter.id,
          status: savedEncounter.status,
          patientId: savedEncounter.patientId,
          practitioner: savedEncounter.practitionerDisplay,
          periodStart: savedEncounter.periodStart,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @Patch()
  async editEncounter(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    encounterData: FhirEncounterDto,
  ) {
    try {
      const savedEncounter =
        await this.encounterService.processAndEditEncounter(
          encounterData as FhirEncounterDto,
        );

      await this.encounterService.sendToFhirServer(
        encounterData,
        this.serverURl,
      );

      this.eventEmitter.emit("patients.updated");

      return {
        statusCode: HttpStatus.CREATED,
        message: "Encounter successfully received and saved",
        data: {
          id: savedEncounter.id,
          status: savedEncounter.status,
          patientId: savedEncounter.patientId,
          practitioner: savedEncounter.practitionerDisplay,
          periodStart: savedEncounter.periodStart,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @Get()
  async getAllEncounters() {
    const encounters = await this.encounterService.getAllEncounters();

    const fhirEncounters = encounters.map((encounter) =>
      this.encounterService.mapEntityToFhir(encounter),
    );

    this.logger.log("getting all encounters", fhirEncounters);

    return {
      statusCode: HttpStatus.OK,
      data: fhirEncounters,
    };
  }

  // @Get(":id")
  // async getEncounter(@Param("id", ParseIntPipe) id: number) {
  //   const encounter = await this.encounterService.getEncounterById(id);
  //
  //   if (!encounter) {
  //     return {
  //       statusCode: HttpStatus.NOT_FOUND,
  //       message: "Encounter not found",
  //     };
  //   }
  //
  //   return {
  //     statusCode: HttpStatus.OK,
  //     data: encounter,
  //   };
  // }

  // @Get("patient/:patientRef")
  // async getEncountersByPatient(@Param("patientRef") patientRef: string) {
  //   const encounters =
  //     await this.encounterService.getEncountersByPatient(patientRef);
  //
  //   return {
  //     statusCode: HttpStatus.OK,
  //     data: encounters,
  //   };
  // }
  //
  // @Get("status/:status")
  // async getEncountersByStatus(@Param("status") status: string) {
  //   const encounters =
  //     await this.encounterService.getEncountersByStatus(status);
  //
  //   return {
  //     statusCode: HttpStatus.OK,
  //     data: encounters,
  //   };
  // }
}
