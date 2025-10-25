import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Patient } from "./patient.entity";

@Entity("encounters")
export class EncounterEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  status: string;

  @ManyToOne(() => Patient, (patient) => patient.encounters, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "patientId" })
  patient: Patient;

  @Column()
  patientId: string;

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
