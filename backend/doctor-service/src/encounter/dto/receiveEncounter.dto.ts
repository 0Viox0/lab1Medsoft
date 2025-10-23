import {
  IsString,
  IsArray,
  IsOptional,
  IsObject,
  ValidateNested,
  IsDateString,
} from "class-validator";
class PeriodDto {
  start: string;
  end?: string;
}

class ReferenceDto {
  reference: string;
  display: string;
}

class ParticipantDto {
  individual: ReferenceDto;
}

class LocationDto {
  location: ReferenceDto;
}

class CodingDto {
  system: string;

  code: string;

  display: string;
}

class ReasonCodeDto {
  coding: CodingDto[];
}

// export type Hehe = {
//   resourceType: string;
//   status: string;
//   class: {
//     system: string;
//     code: string;
//     display: string;
//   };
//   subject: {
//     reference: string;
//     display: string;
//   };
//   participant: ParticipantDto[];
//   period: {
//     start: string;
//     end: string;
//   };
//   location: LocationDto[];
//   reasonCode: ReasonCodeDto[];
// };

export type ReceiveEncounterDto = {
  resourceType: string;
  status: string;
  class: {
    system: string;
    code: string;
    display: string;
  };
  subject: {
    reference: string;
    display: string;
  };
  participant: ParticipantDto[];
  period: {
    start: string;
    end: string;
  };
  location: LocationDto[];
  reasonCode: ReasonCodeDto[];
};
