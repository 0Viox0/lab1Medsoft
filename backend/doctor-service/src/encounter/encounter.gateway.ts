import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { OnEvent } from "@nestjs/event-emitter";
import { EncounterService } from "./encounter.service";
import { EncounterResponseDto } from "./dto/encounterResponse.dto";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/" })
export class EncounterGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly encounterService: EncounterService) {}

  @SubscribeMessage("requestAllVisits")
  async handleRequestAllPatients() {
    this.emitAllVisits(await this.encounterService.getAllEncounters());
  }

  @OnEvent("visits.updated")
  async handlePatientsUpdated() {
    this.emitAllVisits(await this.encounterService.getAllEncounters());
  }

  emitAllVisits(list: EncounterResponseDto[]) {
    this.server.emit("visits", list);
  }
}
