import { Injectable } from "@nestjs/common";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import { HL7Message, HL7Segment, HL7Version } from "hl7v2";

@Injectable()
export class HL7Service {
  private hospitalUrl: string;

  constructor() {
    const envPath = path.resolve(process.cwd(), ".env");
    dotenv.config({ path: envPath });

    this.hospitalUrl = process.env.HOSPITAL_URL || "https://localhost:3001/hl7";
  }

  buildHL7v2(payload: {
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    id?: string;
    action: "CREATE" | "DELETE" | "GET";
  }): string {
    const msg = new HL7Message(HL7Version.v2_5);
    const msh = new HL7Segment(msg, "MSH");
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);
    const messageControlId = uuidv4();

    // Determine message type based on action
    let msgType: string;
    switch (payload.action) {
      case "CREATE":
        msgType = "ADT^A01";
        break;
      case "DELETE":
        msgType = "ADT^A03";
        break;
      case "GET":
        msgType = "QBP^Q22";
        break;
      default:
        msgType = "ADT^A08"; // Default to update
    }

    msh.field(1).setValue("|");
    msh.field(2).setValue("^~\\&");
    msh.field(3).setValue("Reception");
    msh.field(4).setValue("FrontDesk");
    msh.field(5).setValue("HospitalSystem");
    msh.field(6).setValue("Main");
    msh.field(7).setValue(timestamp);
    msh.field(8).setValue(msgType);
    msh.field(9).setValue(messageControlId);
    msh.field(10).setValue("P");
    msh.field(11).setValue("2.3");

    const segments: string[] = [msh.toHL7String()];

    if (payload.action === "CREATE") {
      const pid = new HL7Segment(msg, "PID");
      const pidId = payload.id || uuidv4();
      pid.field(3).setValue(pidId);
      pid
        .field(5)
        .setValue(`${payload.lastName || ""}^${payload.firstName || ""}`);
      pid.field(7).setValue(payload.birthDate || "");
      pid.field(26).setValue(payload.action);

      segments.push(pid.toHL7String());
    } else if (payload.action === "DELETE") {
      // For DELETE (ADT^A03 - Discharge), we need PID and EVN segments
      const evn = new HL7Segment(msg, "EVN");
      evn.field(1).setValue("A03"); // Event type code
      evn.field(2).setValue(timestamp); // Recorded date/time
      evn.field(4).setValue("D"); // Event reason code (Discharge)

      segments.push(evn.toHL7String());

      const pid = new HL7Segment(msg, "PID");
      if (payload.id) {
        pid.field(3).setValue(payload.id); // Patient ID to delete
      }
      if (payload.lastName || payload.firstName) {
        pid
          .field(5)
          .setValue(`${payload.lastName || ""}^${payload.firstName || ""}`);
      }

      segments.push(pid.toHL7String());

      // PV1 segment is typically required for ADT^A03
      const pv1 = new HL7Segment(msg, "PV1");
      pv1.field(1).setValue("1"); // Set ID
      pv1.field(2).setValue("D"); // Patient class - Discharged
      pv1.field(3).setValue(""); // Assigned patient location (empty for discharge)

      segments.push(pv1.toHL7String());
    } else if (payload.action === "GET") {
      // For GET (QBP^Q22 - Patient Query), we need QPD and RCP segments
      const qpd = new HL7Segment(msg, "QPD");
      qpd.field(1).setValue("Q22^Get Patients^HL7"); // Query name
      qpd.field(2).setValue(messageControlId); // Query tag
      qpd.field(3).setValue(""); // Parameters (empty for all patients)

      segments.push(qpd.toHL7String());

      const rcp = new HL7Segment(msg, "RCP");
      rcp.field(1).setValue("I"); // Response priority - Immediate
      rcp.field(2).setValue("999^RD"); // Quantity limited request - up to 999 records

      segments.push(rcp.toHL7String());

      // Optional: Add search criteria if provided
      if (payload.id || payload.lastName || payload.firstName) {
        const queryParams = [];
        if (payload.id) queryParams.push(`@PID.3.1^${payload.id}`);
        if (payload.lastName) queryParams.push(`@PID.5.1^${payload.lastName}`);
        if (payload.firstName)
          queryParams.push(`@PID.5.2^${payload.firstName}`);

        // Update QPD with search parameters
        qpd.field(3).setValue(queryParams.join("~"));
      }
    }

    const hl7MessageForLogging = segments.join("\n") + "\n";
    const hl7Message = segments.join("\r") + "\r";
    console.log(
      `HL7v2 ${payload.action} message to send:\n`,
      hl7MessageForLogging,
    );

    return hl7Message;
  }

  async sendHL7(hl7Message: string) {
    const https = require("https");
    const agent = new https.Agent({
      rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0",
    });

    // console.log("~~~~~~~sldkfjlskdflskdjflskdj hre it is", hl7Message);
    const res = await axios.post(this.hospitalUrl, hl7Message, {
      headers: { "Content-Type": "text/plain" },
      httpsAgent: agent,
    });

    // console.log("received result (receptionBackend)", res);

    // return res.data;
    return "hehe";
  }
}
