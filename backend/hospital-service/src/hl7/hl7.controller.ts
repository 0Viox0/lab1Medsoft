import {
  Controller,
  Post,
  Body,
  Req,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HL7Service } from "./hl7.service";
import { Request } from "express";

interface HL7Response {
  ok: boolean;
  reason?: string;
  error?: string;
}

@Controller("hl7")
export class HL7Controller {
  private readonly logger = new Logger(HL7Controller.name);

  constructor(private readonly hl7Service: HL7Service) {}

  @Post()
  async receive(
    @Req() req: Request,
    @Body() body: any,
  ): Promise<string | HL7Response> {
    const hl7Text = this.extractHL7Text(body, req);

    if (!hl7Text) {
      this.logger.error("No HL7 text found in request");
      return this.createErrorResponse("No HL7 text found");
    }

    this.logger.log("<<<< message received:\n" + hl7Text.replace(/\r/g, "\n"));

    try {
      const parsed = this.hl7Service.parseHL7Text(hl7Text);
      const result = await this.hl7Service.processHL7(parsed);

      this.logger.log(">>>> message sent:\n" + result.replace(/\r/g, "\n"));

      return result;
    } catch (error) {
      this.logger.error("HL7 processing error:", error);
      return this.createErrorResponse("Processing error", error.message);
    }
  }

  private extractHL7Text(body: any, req: Request): string | null {
    if (typeof body === "string") {
      return body;
    }
    if (req.body?.rawBody) {
      return req.body.rawBody.toString();
    }
    if (body?.payload) {
      return body.payload;
    }
    return null;
  }

  private createErrorResponse(reason: string, error?: string): HL7Response {
    return {
      ok: false,
      reason,
      ...(error && { error }),
    };
  }
}
