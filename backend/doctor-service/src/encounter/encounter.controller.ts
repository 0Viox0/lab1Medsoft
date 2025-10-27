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
}
