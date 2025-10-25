import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { EncounterEntity } from "./encounter.entity";

@Entity()
export class Patient {
  @PrimaryColumn("text")
  id: string;

  @Column("text")
  firstName: string;

  @Column("text")
  lastName: string;

  @Column("text")
  birthDate: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => EncounterEntity, (encounter) => encounter.patient, {
    cascade: true,
    onDelete: "CASCADE",
  })
  encounters: EncounterEntity[];
}
