import {
  Controller,
  Post,
  Body,
  HttpStatus,
  ValidationPipe,
  InternalServerErrorException,
} from "@nestjs/common";
import { EncounterService } from "./encounter.service";
import { ReceiveEncounterDto } from "./dto/receiveEncounter.dto";
import { HttpsClientService } from "../httpsClient/httpsClient.service";

@Controller("encounters")
export class EncounterReceiverController {
  constructor(private readonly encounterService: EncounterService) {}

  @Post()
  async receiveEncounter(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    encounterData: ReceiveEncounterDto,
  ) {
    console.log(
      "service has received notification that patient was set a visit",
      encounterData,
    );

    return "hehe";
    // try {
    //   const savedEncounter =
    //     await this.encounterService.processAndSaveEncounter(
    //       encounterData as ReceiveEncounterDto,
    //     );
    //
    //   return {
    //     statusCode: HttpStatus.CREATED,
    //     message: "Encounter successfully received and saved",
    //     data: {
    //       id: savedEncounter.id,
    //       status: savedEncounter.status,
    //       patient: savedEncounter.patientDisplay,
    //       practitioner: savedEncounter.practitionerDisplay,
    //       periodStart: savedEncounter.periodStart,
    //     },
    //   };
    // } catch (error) {
    //   throw new InternalServerErrorException(error);
    //   // return {
    //   //   statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    //   //   message: `Failed to process encounter: ${error.message}`,
    //   // };
    // }
  }

  // @Get()
  // async getAllEncounters() {
  //   const encounters = await this.encounterService.getAllEncounters();
  //
  //   return {
  //     statusCode: HttpStatus.OK,
  //     data: encounters,
  //   };
  // }
  //
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
  //
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
