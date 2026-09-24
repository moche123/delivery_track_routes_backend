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

  /**
   * Un solo campo para creación Y última actualización (no dos columnas
   * separadas). El default de Postgres lo llena al insertar; cada operación
   * que cambia el pedido (asignar, cancelar, entregar, editar) lo vuelve a
   * escribir con la hora actual. El mapa del rider ordena por esto, no por
   * `id`, para que un pedido cancelado y re-tomado pase a ser el más
   * reciente otra vez (con `id` solo, quedaba pegado a su antigüedad
   * original — ver DOCUMENTACION_RIDER.md).
   */
  @Column({
    name: 'actualizado_en',
    type: 'timestamptz',
    default: () => 'now()',
  })
  actualizadoEn!: Date;
}
