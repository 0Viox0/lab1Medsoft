import { Injectable } from "@nestjs/common";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import {
  HL7Message,
  HL7Segment,
  HL7Version,
} from "hl7v2";

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

    const msh = new HL7Segment(msg,"MSH");
    const timestamp = new Date()
        .toISOString()
        .replace(/[-:T.Z]/g, "")
        .slice(0, 14);
    const messageControlId = uuidv4();
    const msgType = payload.action === "CREATE" ? "ADT^A01" : "ADT^A08";

    msh.field(1).setValue("|")
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

    const pid = new HL7Segment(msg,"PID");
    const pidId = payload.id || uuidv4();
    pid.field(3).setValue(pidId);
    pid.field(5).setValue(`${payload.lastName || ""}^${payload.firstName || ""}`);
    pid.field(7).setValue(payload.birthDate || "");
    pid.field(26).setValue(payload.action);

    console.log("HL7v2 message to send:\n",`${msh.toHL7String()}\n${pid.toHL7String()}\n`);
    return `${msh.toHL7String()}\r${pid.toHL7String()}\r`;
  }

  async sendHL7(hl7Message: string) {
    const https = require("https");
    const agent = new https.Agent({
      rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0",
    });

    console.log("before acc !!!!:", hl7Message);
    const res = await axios.post(this.hospitalUrl, hl7Message, {
      headers: { "Content-Type": "text/plain" },
      httpsAgent: agent,
    });

    return res.data;
  }
}
