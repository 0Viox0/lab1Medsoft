import { Injectable } from "@nestjs/common";

@Injectable()
export class HttpsClientService {
  getHttpsAgent() {
    const https = require("https");
    const agent = new https.Agent({
      rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== "0",
    });

    return agent;
  }
}
