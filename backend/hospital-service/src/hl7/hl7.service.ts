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
      console.log("♻️ [Hospital] Кеш пациентов обновлён:", this.cachedPatients.length);
    } catch (err) {
      console.error("❌ Не удалось обновить кеш пациентов:", err);
    }
  }

  private getCachedPatients() {
    return this.cachedPatients;
  }

  // 📥 Парсинг входящего HL7
  parseHL7Text(message: string): HL7Message {
    try {
      console.log("📩 [Hospital] Получено HL7 сообщение:\n", message.replace(/\r/g, "\n"));
      const parsed = HL7Message.parse(message);
      return parsed;
    } catch (err) {
      console.error("❌ Ошибка при парсинге HL7:", err);
      throw new Error("Invalid HL7 message");
    }
  }

  // 🔄 Основной обработчик
  async processHL7(parsed: HL7Message) {
    const msh = parsed.getSegment("MSH");
    const pid = parsed.getSegment("PID");
    console.log("📋 [Hospital] Начало обработки HL7 сообщения...");

    const messageType = msh?.field(8)?.getValue()?.toString().split("^")[0];
    const triggerEvent = msh?.field(8)?.getValue()?.toString().split("^")[1];
    console.log(`➡️ Тип: ${messageType}, Событие: ${triggerEvent}`);

    // --- Обработка QBP^Q22 (GET-запрос на пациентов) ---
    if (messageType === "QBP" && triggerEvent === "Q22") {
      console.log("🟦 [Hospital] Запрошен список последних 10 пациентов...");

      const patients = this.getCachedPatients();
      console.log("✅ [Hospital] Пациенты получены:", patients);

      // Если пусто — логим и создаём заглушку
      if (!patients || patients.length === 0) {
        console.warn("⚠️ [Hospital] Список пациентов пуст, добавляем фиктивного пациента для отладки.");
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

    // --- Если PID отсутствует, просто ACK ---
    if (!pid) {
      console.log("⚠️ PID сегмент отсутствует, возвращаем простой ACK");
      return this.buildHL7Response(parsed, []);
    }

    // --- Парсим пациента ---
    const id = pid.field(3).getValue().toString();
    if (messageType === "ADT" && triggerEvent === "A03"){
      await this.patients.deleteById(id);
      return this.buildHL7Response(parsed, []);
    }
    const [lastName, firstName] = pid.field(5)?.getValue()?.toString().split("^");
    const birthDate = pid.field(7)?.getValue()?.toString() || "";


    // --- Получаем действие ---
    const actionField = pid.field(pid.fields.length);
    const action = actionField?.getValue()?.toUpperCase() || "";

    console.log(`🧩 Пациент: ID=${id}, ${lastName} ${firstName}, DOB=${birthDate}, Action=${action}`);

    // --- CREATE ---
    if (action === "CREATE" || (messageType === "ADT" && triggerEvent === "A01")) {
      console.log("🟢 [Hospital] Создание пациента...");
      await this.patients.createFromHL7({ id, firstName, lastName, birthDate, raw: parsed.toHL7String() });
      return this.buildHL7Response(parsed, []);
    }

    // --- DELETE ---
    if (action === "DELETE" || (messageType === "ADT" && triggerEvent === "A03")) {
      console.log("🔴 [Hospital] Удаление пациента...");
      await this.patients.deleteById(id);
      return this.buildHL7Response(parsed, []);
    }

    console.log("⚪ [Hospital] Неизвестное действие, возвращаем ACK");
    return this.buildHL7Response(parsed, []);
  }

  // 🏗️ Формирование HL7-ответа
  buildHL7Response(originalMessage: HL7Message, patients: any[] = []): string {
    console.log("🏗️ [Hospital] Начало сборки HL7-ответа...");
    const response = new HL7Message(HL7Version.v2_5);
    const msh = new HL7Segment(response, "MSH");
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
    const originalMSH = originalMessage.getSegment("MSH");

    // --- MSH ---
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

    // --- MSA ---
    const msa = new HL7Segment(response, "MSA");
    msa.field(1).setValue("AA");
    msa.field(2).setValue(originalMSH?.field(10).toString() || "");

    const segments = [msh.toHL7String(), msa.toHL7String()];
    patients = this.cachedPatients
    // --- PID ---
    if (patients.length > 0) {
      console.log(`🧾 [Hospital] Добавляем ${patients.length} пациентов в HL7-ответ...`);
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
      console.warn("⚠️ [Hospital] Пациенты не переданы в buildHL7Response!");
      console.warn(patients.length)
    }

    const hl7Response = segments.join("\r") + "\r";
    console.log("📤 [Hospital] HL7 ответ (готов к отправке):\n", hl7Response.replace(/\r/g, "\n"));
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
