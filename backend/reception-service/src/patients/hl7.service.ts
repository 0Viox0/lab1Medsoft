import { Injectable } from "@nestjs/common";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import dotenv from "dotenv";
import { HL7Message, HL7Segment, HL7Version } from "hl7v2";

import { HL7_CONFIG, HL7Action, HL7Payload } from "./hl7.types";
import { PatientResponseDto } from "./dto/patientResponse.dto";

@Injectable()
export class HL7Service {
  private hospitalUrl: string;

  constructor() {
    const envPath = path.resolve(process.cwd(), ".env");
    dotenv.config({ path: envPath });

    this.hospitalUrl = process.env.HOSPITAL_URL || "https://localhost:3001/hl7";
  }

  public buildHL7v2(payload: HL7Payload): string {
    const msg = new HL7Message(HL7Version.v2_5);
    const segments: string[] = [this.buildMSHSegment(msg, payload.action)];

    switch (payload.action) {
      case "CREATE":
        segments.push(this.buildPIDSegment(msg, payload));
        break;
      case "DELETE":
        segments.push(this.buildEVNSegment(msg));
        segments.push(this.buildPIDSegment(msg, payload));
        segments.push(this.buildPV1Segment(msg));
        break;
      case "GET":
        segments.push(
          this.buildQPDSegment(msg, this.generateMessageControlId()),
        );
        segments.push(this.buildRCPSegment(msg));
        break;
    }

    return segments.join("\r") + "\r";
  }

  public async sendHL7(hl7Message: string) {
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

  public parseHL7Response(hl7Message: string) {
    const message = HL7Message.parse(hl7Message);
    const patients: PatientResponseDto[] = [];
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

  private buildMSHSegment(msg: HL7Message, action: HL7Action) {
    const msh = new HL7Segment(msg, "MSH");
    const timestamp = this.getHl7Timestamp();
    const messageControlId = uuidv4();

    msh.field(1).setValue("|");
    msh.field(2).setValue("^~\\&");
    msh.field(3).setValue(HL7_CONFIG.SENDING_APPLICATION);
    msh.field(4).setValue(HL7_CONFIG.SENDING_FACILITY);
    msh.field(5).setValue(HL7_CONFIG.RECEIVING_APPLICATION);
    msh.field(6).setValue(HL7_CONFIG.RECEIVING_FACILITY);
    msh.field(7).setValue(timestamp);
    msh.field(8).setValue(this.getMsgType(action));
    msh.field(9).setValue(messageControlId);
    msh.field(10).setValue("P");
    msh.field(11).setValue("2.5");

    return msh.toHL7String();
  }

  private buildPIDSegment(msg: HL7Message, payload: HL7Payload): string {
    const pid = new HL7Segment(msg, "PID");
    const pidId = payload.id || uuidv4();

    pid.field(3).setValue(pidId);

    if (payload.lastName || payload.firstName) {
      pid
        .field(5)
        .setValue(`${payload.lastName || ""}^${payload.firstName || ""}`);
    }

    if (payload.birthDate) {
      pid.field(7).setValue(payload.birthDate);
    }

    if (payload.action === "CREATE") {
      pid.field(26).setValue(payload.action);
    }

    return pid.toHL7String();
  }

  private buildEVNSegment(msg: HL7Message): string {
    const evn = new HL7Segment(msg, "EVN");
    const timestamp = this.getHl7Timestamp();

    evn.field(1).setValue("A03");
    evn.field(2).setValue(timestamp);
    evn.field(4).setValue("D");

    return evn.toHL7String();
  }

  private buildPV1Segment(msg: HL7Message): string {
    const pv1 = new HL7Segment(msg, "PV1");

    pv1.field(1).setValue("1");
    pv1.field(2).setValue("D");
    pv1.field(3).setValue("");

    return pv1.toHL7String();
  }

  private buildQPDSegment(msg: HL7Message, messageControlId: string): string {
    const qpd = new HL7Segment(msg, "QPD");

    qpd.field(1).setValue("Q22^Get Patients^HL7");
    qpd.field(2).setValue(messageControlId);
    qpd.field(3).setValue("");

    return qpd.toHL7String();
  }

  private buildRCPSegment(msg: HL7Message) {
    const rcp = new HL7Segment(msg, "RCP");

    rcp.field(1).setValue("I");
    rcp.field(2).setValue("10^RD");

    return rcp.toHL7String();
  }

  private getHl7Timestamp() {
    return new Date()
      .toISOString()
      .replace(/[-:T.Z]/g, "")
      .slice(0, 14);
  }

  private getMsgType(action: HL7Action) {
    const msgTypes = {
      CREATE: "ADT^A01",
      DELETE: "ADT^A03",
      GET: "QBP^Q22",
    };

    return msgTypes[action] || "ADT^A08";
  }

  private generateMessageControlId(): string {
    return uuidv4();
  }

  private hl7ToDate(hl7Date: string): Date {
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
