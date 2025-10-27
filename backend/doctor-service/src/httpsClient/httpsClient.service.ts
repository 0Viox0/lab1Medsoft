import { Injectable } from "@nestjs/common";

@Injectable()
export class HttpsClientService {
  getHttpsAgent() {
    const https = require("https");
    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    return agent;
  }
}
