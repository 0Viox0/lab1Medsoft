import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { PatientsModule } from "./patients/patient.module";
import { Hl7Module } from "./hl7/hl7.module";
import { Patient } from "./patients/entities/patient.entity";

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "sqlite",
      database: process.env.DATABASE_FILE || "./data.sqlite",
      entities: [Patient],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([Patient]),
    PatientsModule,
    Hl7Module,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
