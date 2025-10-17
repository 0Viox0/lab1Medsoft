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
        msgType = "ADT^A08";
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
    msh.field(11).setValue("2.5");

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
      const evn = new HL7Segment(msg, "EVN");

      evn.field(1).setValue("A03");
      evn.field(2).setValue(timestamp);
      evn.field(4).setValue("D");

      segments.push(evn.toHL7String());

      const pid = new HL7Segment(msg, "PID");

      if (payload.id) {
        pid.field(3).setValue(payload.id);
      }

      if (payload.lastName || payload.firstName) {
        pid
          .field(5)
          .setValue(`${payload.lastName || ""}^${payload.firstName || ""}`);
      }

      segments.push(pid.toHL7String());

      const pv1 = new HL7Segment(msg, "PV1");
      pv1.field(1).setValue("1");
      pv1.field(2).setValue("D");
      pv1.field(3).setValue("");

      segments.push(pv1.toHL7String());
    } else if (payload.action === "GET") {
      const qpd = new HL7Segment(msg, "QPD");

      qpd.field(1).setValue("Q22^Get Patients^HL7");
      qpd.field(2).setValue(messageControlId);
      qpd.field(3).setValue("");

      segments.push(qpd.toHL7String());

      const rcp = new HL7Segment(msg, "RCP");

      rcp.field(1).setValue("I");
      rcp.field(2).setValue("10^RD");

      segments.push(rcp.toHL7String());
    }

    const hl7Message = segments.join("\r") + "\r";

    return hl7Message;
  }

  async sendHL7(hl7Message: string) {
    const https = require("https");
    const agent = new https.Agent({
      rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0",
    });

    console.log(">>>> message sent:\n", hl7Message.replace(/\r/g, "\n"), "\n");

    const res = await axios.post(this.hospitalUrl, hl7Message, {
      headers: { "Content-Type": "text/plain" },
      httpsAgent: agent,
    });

    console.log(
      "<<<< message received:\n",
      res.data.replace(/\r/g, "\n"),
      "\n",
      "\n",
    );

    return res.data;
  }

  parseHL7Response(hl7Message: string) {
    const message = HL7Message.parse(hl7Message);
    const patients = [];
    let index = 0;

    while (true) {
      const pid = message.getSegment("PID", index);
      if (!pid) break;

      const nameField = pid.field(5).getValue()?.toString() || "";
      const [lastName, firstName] = nameField.split("^");
      patients.push({
        id: pid.field(3).getValue()?.toString() || "",
        firstName: firstName || "",
        lastName: lastName || "",
        birthDate: this.hl7ToDate(pid.field(7).getValue()?.toString()),
      });

      index++;
    }

    return patients;
  }

  hl7ToDate(hl7Date: string): Date {
    if (!hl7Date || hl7Date.trim() === "") {
      return new Date();
    }

    const cleanDate = hl7Date.replace(/[^\d]/g, "");

    const year =
      cleanDate.length >= 4
        ? parseInt(cleanDate.substring(0, 4))
        : new Date().getFullYear();
    const month =
      cleanDate.length >= 6 ? parseInt(cleanDate.substring(4, 6)) - 1 : 0;
    const day = cleanDate.length >= 8 ? parseInt(cleanDate.substring(6, 8)) : 1;

    const hour =
      cleanDate.length >= 10 ? parseInt(cleanDate.substring(8, 10)) : 0;
    const minute =
      cleanDate.length >= 12 ? parseInt(cleanDate.substring(10, 12)) : 0;
    const second =
      cleanDate.length >= 14 ? parseInt(cleanDate.substring(12, 14)) : 0;

    return new Date(year, month, day, hour, minute, second);
  }
}
