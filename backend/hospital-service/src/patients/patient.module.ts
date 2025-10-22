import { Module } from "@nestjs/common";
import { PatientGateway } from "./patient.gateway";
import { PatientsService } from "./patients.service";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { Patient } from "./entities/patient.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [EventEmitterModule, TypeOrmModule.forFeature([Patient])],
  controllers: [],
  providers: [PatientGateway, PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
