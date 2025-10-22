import { Module } from "@nestjs/common";
import { EncounterController } from "./encounter.controller";
import { FhirEncounterService } from "./encounter.service";
import { HttpsClientModule } from "../httpsClient/httpsClient.module";

@Module({
  imports: [HttpsClientModule],
  controllers: [EncounterController],
  providers: [FhirEncounterService],
  exports: [],
})
export class FhirEncounterModule {}
