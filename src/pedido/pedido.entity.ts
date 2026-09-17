import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Usuario } from '../auth/usuario.entity';

export type PedidoEstado =
  'no_asignado' | 'asignado' | 'eliminado' | 'entregado';

@Entity('pedido')
export class Pedido {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ubicacion!: string | null;

  @Column({ name: 'driver_id', type: 'int', nullable: true })
  driverId!: number | null;

  @ManyToOne(() => Usuario, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'driver_id' })
  driver!: Usuario | null;

  @Column({ name: 'usuario_id', type: 'int' })
  usuarioId!: number;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column({ type: 'varchar', length: 20, default: 'no_asignado' })
  estado!: PedidoEstado;

  @Column({ type: 'varchar', length: 255 })
  destino!: string;

  @Column({ type: 'text', nullable: true })
  foto!: string | null;
}
