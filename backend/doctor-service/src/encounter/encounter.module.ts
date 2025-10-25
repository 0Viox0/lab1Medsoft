import { Module } from "@nestjs/common";
import { HttpsClientModule } from "../httpsClient/httpsClient.module";
import { EncounterReceiverController } from "./encounter.controller";
import { EncounterService } from "./encounter.service";
import { EncounterGateway } from "./encounter.gateway";

@Module({
  imports: [HttpsClientModule],
  controllers: [EncounterReceiverController],
  providers: [EncounterService, EncounterGateway],
})
export class FhirEncounterModule {}
