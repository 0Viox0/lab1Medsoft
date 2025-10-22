import { Controller, Post, Body, Delete, Get } from "@nestjs/common";

import { HL7Service } from "./hl7.service";
import { CreatePatientDto } from "./dto/createPatient.dto";
import { DeletePatientDto } from "./dto/deletePatient.dto";
import { PatientResponseDto } from "./dto/patientResponse.dto";

@Controller("patients")
export class PatientsController {
  constructor(private readonly hl7: HL7Service) {}

  @Post()
  async create(@Body() body: CreatePatientDto) {
    const msg = this.hl7.buildHL7v2({ ...body, action: "CREATE" });

    return this.hl7.sendHL7(msg);
  }

  @Delete()
  async remove(@Body() body: DeletePatientDto) {
    const msg = this.hl7.buildHL7v2({ id: body.id, action: "DELETE" });

    return this.hl7.sendHL7(msg);
  }

  @Get()
  async getPatients(): Promise<PatientResponseDto[]> {
    const msg = this.hl7.buildHL7v2({ action: "GET" });
    const resp: string = await this.hl7.sendHL7(msg);

    return this.hl7.parseHL7Response(resp);
  }
}
