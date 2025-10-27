import { Controller, Post, HttpStatus, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";

@Controller("encounters")
export class EncounterReceiverController {
  private readonly logger = new Logger(EncounterReceiverController.name);

  constructor(private eventEmitter: EventEmitter2) {}

  @Post()
  async receiveEncounter() {
    this.logger.log(
      "service has received notification that patient was set a visit",
    );

    this.eventEmitter.emit("visits.updated");

    return { statusCode: HttpStatus.OK };
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
