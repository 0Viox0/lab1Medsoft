import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("encounters")
export class EncounterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", nullable: true })
  fhirId: string;

  @Column({ type: "varchar" })
  status: string;

  @Column({ type: "varchar" })
  patientReference: string;

  @Column({ type: "varchar" })
  patientDisplay: string;

  @Column({ type: "varchar" })
  practitionerReference: string;

  @Column({ type: "varchar" })
  practitionerDisplay: string;

  @Column({ type: "datetime" })
  periodStart: Date;

  @Column({ type: "datetime", nullable: true })
  periodEnd: Date;

  @Column({ type: "varchar", nullable: true })
  location: string;

  @Column({ type: "text", nullable: true })
  reasonCodes: string;

  @Column({ type: "text", nullable: true })
  rawFhirData: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
