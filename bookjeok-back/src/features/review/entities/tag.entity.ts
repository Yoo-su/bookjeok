import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('tags')
@Unique(['name'])
export class Tag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
