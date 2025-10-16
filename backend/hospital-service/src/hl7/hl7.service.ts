import { Injectable } from "@nestjs/common";
import { PatientsService } from "../patients/patients.service";
import path from "path";
import dotenv from "dotenv";
import {
  HL7Message,
  HL7Segment,
  HL7Version,
} from "hl7v2";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class HL7Service {

  constructor(private readonly patients: PatientsService) {
    const envPath = path.resolve(process.cwd(), ".env");
    dotenv.config({ path: envPath });
  }

  parseHL7Text(message: string): HL7Message {
    try {
      const parsed = HL7Message.parse(message);
      return parsed;
    } catch (err) {
      console.error("Ошибка при парсинге HL7:", err);
      throw new Error("Invalid HL7 message");
    }
  }

  async processHL7(parsed: HL7Message) {
    const msh = parsed.getSegment("MSH");
    const pid = parsed.getSegment("PID");
    console.log("pid");
    if (!pid) {
      console.log("!!!!!!!!!!2333333")
      return { ok: false, reason: "PID segment not found" };
    }

    // Получаем данные из PID сегмента
    const id = pid.field(3).component(1).toString(); // Patient ID
    const lastName = pid.field(5).component(1).toString(); // Last Name
    const firstName = pid.field(5).component(2).toString(); // First Name
    const birthDate = pid.field(7).component(1).toString(); // Date of Birth
    console.log("HL7", msh, lastName, firstName, birthDate);

    // Получаем действие из последнего поля PID или из MSH-9
    const actionField = pid.field(pid.fields.length);
    const action = actionField ? actionField.component(1).toString().toUpperCase() : "CREATE";

    // Альтернативно можно получить тип сообщения из MSH
    const messageType = msh?.field(9).component(1).toString();
    const triggerEvent = msh?.field(9).component(2).toString();

    console.log(`Processing HL7 message: ${messageType}^${triggerEvent}, Action: ${action}`);

    if (action === "CREATE" || messageType === "ADT" && triggerEvent === "A01") {
      const patient = await this.patients.createFromHL7({
        id,
        firstName,
        lastName,
        birthDate,
        raw: parsed.toHL7String(),
      });
      return { ok: true, id: patient.id, action: "CREATE" };
    } else if (action === "DELETE" || messageType === "ADT" && triggerEvent === "A03") {
      const ok = await this.patients.deleteById(id);
      return { ok, action: "DELETE" };
    } else if (action === "GET" || messageType === "QRY") {
      const patients = await this.patients.last10();
      return { ok: true, data: patients, action: "GET" };
    }

    return { ok: false, reason: "Unknown action or message type" };
  }

  // Метод для построения HL7 ответного сообщения
  buildHL7Response(originalMessage: HL7Message, responseData: any): string {
    const responseMsg = new HL7Message(HL7Version.v2_5);

    // MSH сегмент для ответа
    const msh = new HL7Segment(responseMsg, "MSH");
    const timestamp = new Date()
        .toISOString()
        .replace(/[-:T.Z]/g, "")
        .slice(0, 14);

    // Получаем данные из оригинального сообщения для ответа
    const originalMSH = originalMessage.getSegment("MSH");
    const originalMessageControlId = originalMSH?.field(10).toString();

    msh.field(1).setValue("|");
    msh.field(2).setValue("^~\\&");
    msh.field(3).setValue("HospitalSystem");
    msh.field(4).setValue("Main");
    msh.field(5).setValue(originalMSH?.field(3).toString() || "Reception");
    msh.field(6).setValue(originalMSH?.field(4).toString() || "FrontDesk");
    msh.field(7).setValue(timestamp);
    msh.field(9).setValue("ACK");
    msh.field(10).setValue(uuidv4());
    msh.field(11).setValue("P");
    msh.field(12).setValue(HL7Version.v2_5);

    // MSA сегмент - подтверждение сообщения
    const msa = new HL7Segment(responseMsg, "MSA");
    msa.field(1).setValue(responseData.ok ? "AA" : "AE");
    msa.field(2).setValue(originalMessageControlId || "");
    if (!responseData.ok) {
      msa.field(3).setValue(responseData.reason || "Error processing message");
    }

    // Если это ответ на GET запрос, добавляем данные пациентов
    if (responseData.action === "GET" && responseData.data) {
      responseData.data.forEach((patient: any) => {
        const pid = new HL7Segment(responseMsg, "PID");
        pid.field(3).setValue(patient.id);
        pid.field(5).setValue(`${patient.lastName || ""}^${patient.firstName || ""}`);
        pid.field(7).setValue(patient.birthDate || "");
      });
    }

    return responseMsg.toHL7String();
  }

  // Вспомогательный метод для извлечения данных из сообщения
  extractPatientData(parsed: HL7Message) {
    const pid = parsed.getSegment("PID");
    if (!pid) return null;

    return {
      id: pid.field(3).component(1).toString(),
      lastName: pid.field(5).component(1).toString(),
      firstName: pid.field(5).component(2).toString(),
      birthDate: pid.field(7).component(1).toString(),
      messageType: parsed.getSegment("MSH")?.field(9).component(1).toString(),
      triggerEvent: parsed.getSegment("MSH")?.field(9).component(2).toString(),
    };
  }
}