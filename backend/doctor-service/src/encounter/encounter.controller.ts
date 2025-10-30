import {
  Controller,
  Post,
  HttpStatus,
  Logger,
  Patch,
  Body,
  ValidationPipe,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CreateEncounterDto } from "./dto/createEncounter.dto";
import { EncounterService } from "./encounter.service";

@Controller("encounters")
export class EncounterReceiverController {
  private readonly logger = new Logger(EncounterReceiverController.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private encounterService: EncounterService,
  ) {}

  @Post()
  async receiveEncounter() {
    this.logger.log(
      "service has received notification that patient was set a visit",
    );

    this.eventEmitter.emit("visits.updated");

    return { statusCode: HttpStatus.OK };
  }

  @Patch()
  async modifyEncounter(
    @Body(new ValidationPipe({ transform: true }))
    createEncounterDto: CreateEncounterDto & { id: string },
  ) {
    const result =
      await this.encounterService.editEncounter(createEncounterDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: "Encounter successfully created",
      data: result,
    };
  }
}
