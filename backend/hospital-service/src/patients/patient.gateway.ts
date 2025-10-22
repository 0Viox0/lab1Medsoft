import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { PatientsService } from "../patients/patients.service";
import { OnEvent } from "@nestjs/event-emitter";
import { Patient } from "./entities/patient.entity";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/" })
export class PatientGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly patientsService: PatientsService) {}

  @SubscribeMessage("requestAllPatients")
  async handleRequestAllPatients() {
    this.emitLast10Patients(await this.patientsService.getLast10());
  }

  @OnEvent("patients.updated")
  async handlePatientsUpdated() {
    this.emitLast10Patients(await this.patientsService.getLast10());
  }

  emitLast10Patients(list: Patient[]) {
    this.server.emit("last10", list);
  }
}
