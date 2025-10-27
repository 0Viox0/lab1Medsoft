import {
  Controller,
  Post,
  Body,
  HttpStatus,
  ValidationPipe,
  Get,
  Patch,
} from "@nestjs/common";
import { CreateEncounterDto } from "./dto/createEncounter.dto";
import { FhirEncounterService } from "./encounter.service";

@Controller("encounters")
export class EncounterController {
  constructor(private readonly fhirEncounterService: FhirEncounterService) {}

  @Post()
  async createEncounter(
    @Body(new ValidationPipe({ transform: true }))
    createEncounterDto: CreateEncounterDto,
  ) {
    const result =
      await this.fhirEncounterService.createEncounter(createEncounterDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: "Encounter successfully created",
      data: result,
    };
  }

  @Patch()
  async modifyEncounter(
    @Body(new ValidationPipe({ transform: true }))
    createEncounterDto: CreateEncounterDto & { id: string },
  ) {
    const result =
      await this.fhirEncounterService.editEncounter(createEncounterDto);

    return {
      statusCode: HttpStatus.CREATED,
      message: "Encounter successfully created",
      data: result,
    };
  }

  @Get()
  async getEncountersByPatient() {
    return this.fhirEncounterService.getEncounters();
  }
}
