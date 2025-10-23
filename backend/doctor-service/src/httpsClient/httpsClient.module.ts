import { Module } from "@nestjs/common";
import { HttpsClientService } from "./httpsClient.service";

@Module({
  imports: [],
  controllers: [],
  providers: [HttpsClientService],
  exports: [HttpsClientService],
})
export class HttpsClientModule {}
