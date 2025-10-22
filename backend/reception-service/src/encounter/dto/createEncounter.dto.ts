import {
  IsString,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class PatientReferenceDto {
  @IsString()
  reference: string;

  @IsString()
  display: string;
}

class PractitionerReferenceDto {
  @IsString()
  reference: string;

  @IsString()
  display: string;
}

export class CreateEncounterDto {
  @IsString()
  status: string;

  @ValidateNested()
  @Type(() => PatientReferenceDto)
  patient: PatientReferenceDto;

  @ValidateNested()
  @Type(() => PractitionerReferenceDto)
  practitioner: PractitionerReferenceDto;

  @IsDateString()
  periodStart: string;

  @IsDateString()
  @IsOptional()
  periodEnd?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  reasonCodes?: string[];
}
