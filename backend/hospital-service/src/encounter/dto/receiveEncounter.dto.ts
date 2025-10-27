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

export type FhirEncounterDto = {
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

export type FhirEncounterDtoWithId = {
  resourceType: string;
  id: string;
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
