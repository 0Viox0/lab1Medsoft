import { Module } from "@nestjs/common";
import { HttpsClientModule } from "../httpsClient/httpsClient.module";
import { EncounterReceiverController } from "./encounter.controller";
import { EncounterService } from "./encounter.service";
import { EncounterEntity } from "../entities/encounter.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [HttpsClientModule, TypeOrmModule.forFeature([EncounterEntity])],
  controllers: [EncounterReceiverController],
  providers: [EncounterService],
})
export class FhirEncounterModule {}
