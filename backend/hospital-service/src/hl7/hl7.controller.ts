import { Controller, Post, Req, Body } from "@nestjs/common";
import { HL7Service } from "./hl7.service";

@Controller("hl7")
export class HL7Controller {
  constructor(private readonly hl7Service: HL7Service) {
  }

  @Post()
  async receive(@Req() req: any, @Body() body: any) {
    let hl7Text: string | null = null;

    // Сохраняем оригинальный HL7 текст из rawBody или body
    if (typeof body === "string") {
      hl7Text = body;
    } else if (req?.rawBody) {
      hl7Text = req.rawBody.toString();
    } else if (body?.payload) {
      hl7Text = body.payload;
    }

    if (!hl7Text) {
      console.error("No HL7 text found");
      return {ok: false, reason: "no HL7 text found"};
    }

    console.log("✅ Incoming HL7:\n", hl7Text);

    try {
      const parsed = this.hl7Service.parseHL7Text(hl7Text);
      const result = this.hl7Service.processHL7(parsed);

      console.log("✅ Outgoing HL7:\n", result);

      return result;
    } catch (err) {
      console.error("HL7 processing error:", err);
      return {ok: false, reason: "processing error", error: err.message};
    }
  }
}
