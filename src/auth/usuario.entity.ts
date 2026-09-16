import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'google_id',
    type: 'varchar',
    length: 64,
    unique: true,
    nullable: true,
  })
  googleId!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  foto!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'cliente' })
  tipo!: string;
}
