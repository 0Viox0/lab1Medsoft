import { Module } from "@nestjs/common";
import { PatientsModule } from "./patients/patients.module";
import { FhirEncounterModule } from "./encounter/encounter.module";
import { HttpsClientModule } from "./httpsClient/httpsClient.module";

@Module({
  imports: [PatientsModule, FhirEncounterModule, HttpsClientModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
