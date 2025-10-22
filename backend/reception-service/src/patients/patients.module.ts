import { Module } from "@nestjs/common";
import { PatientsController } from "./patients.controller";
import { HL7Service } from "./hl7.service";

@Module({
  controllers: [PatientsController],
  providers: [HL7Service],
})
export class PatientsModule {}
