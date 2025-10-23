import { Injectable, Logger } from "@nestjs/common";
import { PatientsService } from "../patients/patients.service";
import { HL7Message, HL7Segment, HL7Version } from "hl7v2";
import { v4 as uuidv4 } from "uuid";
import { Patient } from "../entities/patient.entity";

interface HL7MessageInfo {
  messageType: string;
  triggerEvent: string;
}

@Injectable()
export class HL7Service {
  private readonly logger = new Logger(HL7Service.name);

  constructor(private readonly patientsService: PatientsService) {}

  parseHL7Text(message: string): HL7Message {
    try {
      return HL7Message.parse(message);
    } catch (error) {
      this.logger.error("Cannot parse HL7:", error);
      throw new Error("Invalid HL7 message");
    }
  }

  async processHL7(parsedMessage: HL7Message): Promise<string> {
    const messageInfo = this.extractMessageInfo(parsedMessage);
    const pidSegment = parsedMessage.getSegment("PID");

    this.logger.debug(
      `Processing HL7 message: ${messageInfo.messageType}^${messageInfo.triggerEvent}`,
    );

    // Handle QBP Query messages
    if (this.isQueryMessage(messageInfo)) {
      return await this.handleQueryMessage(parsedMessage);
    }

    // Handle ADT messages with PID segment
    if (pidSegment) {
      return await this.handleADTMessage(
        parsedMessage,
        messageInfo,
        pidSegment,
      );
    }

    this.logger.warn("No PID segment found in message, sending empty response");
    return await this.buildHL7Response(parsedMessage, []);
  }

  async buildHL7Response(
    originalMessage: HL7Message,
    patients: Patient[] = [],
  ): Promise<string> {
    const response = new HL7Message(HL7Version.v2_5);
    const originalMSH = originalMessage.getSegment("MSH");
    const messageInfo = this.extractMessageInfo(originalMessage);

    // Build MSH segment
    const msh = this.buildMSHSegment(response, originalMSH);

    // Build MSA segment
    const msa = this.buildMSASegment(response, originalMSH);

    const segments = [msh.toHL7String(), msa.toHL7String()];

    // Add PID segments for query responses
    if (this.isQueryMessage(messageInfo)) {
      const patientSegments = await this.buildPatientSegments(
        response,
        patients,
      );
      segments.push(...patientSegments);
    }

    return segments.join("\r") + "\r";
  }

  // Private helper methods
  private extractMessageInfo(parsedMessage: HL7Message): HL7MessageInfo {
    const msh = parsedMessage.getSegment("MSH");
    const messageField = msh?.field(8)?.getValue()?.toString() || "^";
    const [messageType = "", triggerEvent = ""] = messageField.split("^");

    return { messageType, triggerEvent };
  }

  private isQueryMessage(messageInfo: HL7MessageInfo): boolean {
    return (
      messageInfo.messageType === "QBP" && messageInfo.triggerEvent === "Q22"
    );
  }

  private async handleQueryMessage(parsedMessage: HL7Message): Promise<string> {
    let patients = await this.patientsService.getLast10();

    if (!patients || patients.length === 0) {
      this.logger.warn("No patients found, sending dummy data");
      patients = [this.createDummyPatient()];
    }

    return await this.buildHL7Response(parsedMessage, patients);
  }

  private async handleADTMessage(
    parsedMessage: HL7Message,
    messageInfo: HL7MessageInfo,
    pidSegment: HL7Segment,
  ): Promise<string> {
    const patientId = pidSegment.field(3).getValue().toString();
    const patientData = this.extractPatientData(pidSegment);

    // Handle patient discharge/delete
    if (messageInfo.triggerEvent === "A03") {
      await this.patientsService.deleteById(patientId);
      return await this.buildHL7Response(parsedMessage, []);
    }

    // Handle patient admission/create
    if (messageInfo.triggerEvent === "A01") {
      await this.patientsService.createFromHL7({
        ...patientData,
        id: patientId,
        raw: parsedMessage.toHL7String(),
      });
      return await this.buildHL7Response(parsedMessage, []);
    }

    this.logger.warn(
      `Unhandled ADT trigger event: ${messageInfo.triggerEvent}`,
    );
    return await this.buildHL7Response(parsedMessage, []);
  }

  private extractPatientData(
    pidSegment: HL7Segment,
  ): Omit<Patient, "id" | "createdAt"> {
    const nameParts =
      pidSegment.field(5)?.getValue()?.toString().split("^") || [];
    const birthDate = this.hl7ToDate(
      pidSegment.field(7)?.getValue(),
    ).toString();

    return {
      lastName: nameParts[0],
      firstName: nameParts[1],
      birthDate,
    };
  }

  private buildMSHSegment(
    response: HL7Message,
    originalMSH?: HL7Segment,
  ): HL7Segment {
    const msh = new HL7Segment(response, "MSH");
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);

    msh.field(1).setValue("|");
    msh.field(2).setValue("^~\\&");
    msh.field(3).setValue("HospitalSystem");
    msh.field(4).setValue("Main");
    msh
      .field(5)
      .setValue(originalMSH?.field(3).getValue().toString() || "Reception");
    msh
      .field(6)
      .setValue(originalMSH?.field(4).getValue().toString() || "FrontDesk");
    msh.field(7).setValue(timestamp);
    msh.field(9).setValue("RSP^K22");
    msh.field(10).setValue(uuidv4());
    msh.field(11).setValue("P");
    msh.field(12).setValue("2.5");

    return msh;
  }

  private buildMSASegment(
    response: HL7Message,
    originalMSH?: HL7Segment,
  ): HL7Segment {
    const msa = new HL7Segment(response, "MSA");
    msa.field(1).setValue("AA");
    msa.field(2).setValue(originalMSH?.field(10).getValue().toString() || "");
    return msa;
  }

  private async buildPatientSegments(
    response: HL7Message,
    patients: Patient[],
  ): Promise<string[]> {
    const segments: string[] = [];
    const patientsToUse =
      patients.length > 0 ? patients : await this.patientsService.getLast10();

    patientsToUse.forEach((patient, index) => {
      const pid = new HL7Segment(response, "PID");
      pid.field(1).setValue((index + 1).toString());
      pid.field(3).setValue(patient.id);
      pid
        .field(5)
        .setValue(`${patient.lastName || ""}^${patient.firstName || ""}`);
      pid.field(7).setValue(this.hl7Date(patient.birthDate));
      segments.push(pid.toHL7String());
    });

    return segments;
  }

  private createDummyPatient(): Patient {
    return {
      id: "TEST123",
      firstName: "John",
      lastName: "Doe",
      birthDate: "19800101",
      createdAt: new Date(),
    };
  }

  hl7Date(date?: string | Date): string {
    if (!date) return "";

    const d = new Date(date);
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
      String(d.getHours()).padStart(2, "0"),
      String(d.getMinutes()).padStart(2, "0"),
      String(d.getSeconds()).padStart(2, "0"),
    ].join("");
  }

  hl7ToDate(hl7Date?: string): Date {
    if (!hl7Date || hl7Date.trim() === "") {
      return new Date();
    }

    const cleanDate = hl7Date.replace(/[^\d]/g, "");

    const extractPart = (
      start: number,
      length: number,
      defaultValue: number,
    ): number =>
      cleanDate.length >= start + length
        ? parseInt(cleanDate.substring(start, start + length))
        : defaultValue;

    const year = extractPart(0, 4, new Date().getFullYear());
    const month = extractPart(4, 2, 1) - 1; // Month is 0-indexed in Date
    const day = extractPart(6, 2, 1);
    const hour = extractPart(8, 2, 0);
    const minute = extractPart(10, 2, 0);
    const second = extractPart(12, 2, 0);

    return new Date(year, month, day, hour, minute, second);
  }
}
