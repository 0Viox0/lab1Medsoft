import { Controller, Post, Body, Delete, Get } from "@nestjs/common";
import { HL7Service } from "./hl7.service";

@Controller("patients")
export class PatientsController {
  constructor(private readonly hl7: HL7Service) {}

  @Post()
  async create(@Body() body: { firstName: string; lastName: string; birthDate: string }) {
    const msg = this.hl7.buildHL7v2({ ...body, action: "CREATE" });
    return this.hl7.sendHL7(msg);
  }

  @Delete()
  async remove(@Body() body: { id: string }) {
    const msg = this.hl7.buildHL7v2({ id: body.id, action: "DELETE" });
    return this.hl7.sendHL7(msg);
  }

  @Get()
  async getPatients() {
    const msg = this.hl7.buildHL7v2({ action: "GET" });
    const resp = this.hl7.sendHL7(msg)
    return this.hl7.parseHL7Response(await resp);
  }
}
