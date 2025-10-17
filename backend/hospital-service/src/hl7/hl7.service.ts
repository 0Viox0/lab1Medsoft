import { Injectable } from "@nestjs/common";
import { PatientsService } from "../patients/patients.service";
import path from "path";
import dotenv from "dotenv";
import { HL7Message, HL7Segment, HL7Version } from "hl7v2";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class HL7Service {
  private cachedPatients: any[] = [];
  constructor(private readonly patients: PatientsService) {
    const envPath = path.resolve(process.cwd(), ".env");
    dotenv.config({ path: envPath });
    this.refreshCache();
    setInterval(() => this.refreshCache(), 5000);
  }

  private async refreshCache() {
    try {
      this.cachedPatients = await this.patients.last10();
      console.log("[Hospital] Cache updated:", this.cachedPatients.length);
    } catch (err) {
      console.error("[Hospital] Cannot update cache:", err);
    }
  }

  private getCachedPatients() {
    return this.cachedPatients;
  }

  parseHL7Text(message: string): HL7Message {
    try {
      console.log("[Hospital] Received HL7:\n", message.replace(/\r/g, "\n"));
      const parsed = HL7Message.parse(message);
      return parsed;
    } catch (err) {
      console.error("Cannot parse HL7:", err);
      throw new Error("Invalid HL7 message");
    }
  }

  async processHL7(parsed: HL7Message) {
    const msh = parsed.getSegment("MSH");
    const pid = parsed.getSegment("PID");

    const messageType = msh?.field(8)?.getValue()?.toString().split("^")[0];
    const triggerEvent = msh?.field(8)?.getValue()?.toString().split("^")[1];
    console.log(`HL7 Type: ${messageType}, Event: ${triggerEvent}`);

    if (messageType === "QBP" && triggerEvent === "Q22") {

      const patients = this.getCachedPatients();

      if (!patients || patients.length === 0) {
        console.warn("[Hospital] No patients found, sending dummy.");
        const dummy = {
          id: "TEST123",
          firstName: "John",
          lastName: "Doe",
          birthDate: "19800101",
        };
        return this.buildHL7Response(parsed, [dummy]);
      }

      return this.buildHL7Response(parsed, patients);
    }

    if (!pid) {
      console.log("NO PID Segment in message");
      return this.buildHL7Response(parsed, []);
    }

    const id = pid.field(3).getValue().toString();
    if (messageType === "ADT" && triggerEvent === "A03"){
      await this.patients.deleteById(id);
      return this.buildHL7Response(parsed, []);
    }
    const [lastName, firstName] = pid.field(5)?.getValue()?.toString().split("^");
    const birthDate = pid.field(7)?.getValue()?.toString() || "";

    const actionField = pid.field(pid.fields.length);
    const action = actionField?.getValue()?.toUpperCase() || "";

    if (action === "CREATE" || (messageType === "ADT" && triggerEvent === "A01")) {
      console.log("[Hospital] Creating patient...");
      await this.patients.createFromHL7({ id, firstName, lastName, birthDate, raw: parsed.toHL7String() });
      return this.buildHL7Response(parsed, []);
    }

    // --- DELETE ---
    if (action === "DELETE" || (messageType === "ADT" && triggerEvent === "A03")) {
      console.log("[Hospital] Deleting Patient...");
      await this.patients.deleteById(id);
      return this.buildHL7Response(parsed, []);
    }

    console.log("[Hospital] Unresolved action");
    return this.buildHL7Response(parsed, []);
  }

  buildHL7Response(originalMessage: HL7Message, patients: any[] = []): string {
    const response = new HL7Message(HL7Version.v2_5);
    const msh = new HL7Segment(response, "MSH");
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const originalMSH = originalMessage.getSegment("MSH");

    // MSH
    msh.field(1).setValue("|");
    msh.field(2).setValue("^~\\&");
    msh.field(3).setValue("HospitalSystem");
    msh.field(4).setValue("Main");
    msh.field(5).setValue(originalMSH?.field(3).toString() || "Reception");
    msh.field(6).setValue(originalMSH?.field(4).toString() || "FrontDesk");
    msh.field(7).setValue(timestamp);
    msh.field(9).setValue("RSP^K22");
    msh.field(10).setValue(uuidv4());
    msh.field(11).setValue("P");
    msh.field(12).setValue("2.5");

    // MSA
    const msa = new HL7Segment(response, "MSA");
    msa.field(1).setValue("AA");
    msa.field(2).setValue(originalMSH?.field(10).toString() || "");

    const segments = [msh.toHL7String(), msa.toHL7String()];
    patients = this.cachedPatients
    // PID
    if (patients.length > 0) {
      patients = this.cachedPatients
      patients.forEach((patient, index) => {
        const pid = new HL7Segment(response, "PID");
        pid.field(1).setValue((index + 1).toString());
        pid.field(3).setValue(patient.id);
        pid.field(5).setValue(`${patient.lastName || ""}^${patient.firstName || ""}`);
        pid.field(7).setValue(this.hl7Date(patient.birthDate));
        segments.push(pid.toHL7String());
      });
    } else {
      console.warn(patients.length)
    }

    const hl7Response = segments.join("\r") + "\r";
    console.log("[Hospital] Sending response:\n", hl7Response.replace(/\r/g, "\n"));
    return hl7Response;
  }

  hl7Date(date: string | Date): string {
    if (!date) return "";
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const h = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const s = String(d.getSeconds()).padStart(2, "0");
    return `${y}${m}${day}${h}${min}${s}`;
  }

}
