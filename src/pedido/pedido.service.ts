import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pedido } from './pedido.entity';
import { AuthService } from 'src/auth/auth.service';
import { RealtimeGateway } from 'src/socket/socket_nest';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

export interface ActualizarPedidoDto {
  nombre?: string;
  destino?: string;
}

@Injectable()
export class PedidoService {
  constructor(
    private readonly authService: AuthService,
    private readonly realtimeGateway: RealtimeGateway,
    @InjectRepository(Pedido)
    private readonly pedidos: Repository<Pedido>,
  ) {}

  async createPedido(usuarioId: number, pedido: Pedido): Promise<Pedido> {
    // Valida que el usuario del access token exista; lanza si no.
    const usuario = await this.authService.me(usuarioId);

    const nuevo = this.pedidos.create({
      ...pedido,
      usuarioId: usuario.id,
    });

    return this.pedidos.save(nuevo);
  }

  async getPedidos(usuarioId: number): Promise<Pedido[]> {
    // Valida que el usuario del access token exista; lanza si no.
    const usuario = await this.authService.me(usuarioId);

    return this.pedidos.find({
      where: { usuarioId: usuario.id },
    });
  }

  async updatePedido(
    usuarioId: number,
    id: number,
    cambios: ActualizarPedidoDto,
  ): Promise<Pedido> {
    // Valida que el usuario del access token exista; lanza si no.
    await this.authService.me(usuarioId);

    const pedido = await this.pedidos.findOne({ where: { id, usuarioId } });
    if (!pedido) {
      throw new NotFoundException('Pedido no encontrado');
    }
    if (pedido.estado === 'eliminado' || pedido.estado === 'entregado') {
      throw new BadRequestException(
        'No se puede editar un pedido eliminado o entregado',
      );
    }

    if (cambios.nombre !== undefined) {
      pedido.nombre = cambios.nombre;
    }
    if (cambios.destino !== undefined) {
      pedido.destino = cambios.destino;
    }

    return this.pedidos.save(pedido);
  }

  async deletePedido(
    usuarioId: number,
    id: number,
  ): Promise<{ deleted: boolean }> {
    await this.authService.me(usuarioId);

    const result = await this.pedidos.update(
      { id, usuarioId },
      { estado: 'eliminado' },
    );

    if (!result.affected) {
      throw new NotFoundException('Pedido no encontrado');
    }

    return { deleted: true };
  }

  async getPedidosDisponibles(): Promise<Pedido[]> {
    return this.pedidos.find({ where: { estado: 'no_asignado' } });
  }

  async asignarPedido(driverId: number, id: number): Promise<Pedido> {
    // Update condicionado por estado: si dos drivers piden el mismo pedido a
    // la vez, solo uno de los dos UPDATE afecta una fila.
    const result = await this.pedidos.update(
      { id, estado: 'no_asignado' },
      { estado: 'asignado', driverId },
    );

    if (!result.affected) {
      throw new BadRequestException('El pedido ya no está disponible');
    }

    const pedido = await this.pedidos.findOneOrFail({ where: { id } });
    this.realtimeGateway.emitAsignacion({
      pedido_id: id,
      driver_id: driverId,
    });
    return pedido;
  }

  async getPedidosAsignados(driverId: number): Promise<Pedido[]> {
    return this.pedidos.find({ where: { driverId, estado: 'asignado' } });
  }

  async cancelarAsignacion(driverId: number, id: number): Promise<Pedido> {
    const result = await this.pedidos.update(
      { id, driverId, estado: 'asignado' },
      { estado: 'no_asignado', driverId: null },
    );

    if (!result.affected) {
      throw new NotFoundException(
        'Pedido no encontrado o no asignado a este driver',
      );
    }

    const pedido = await this.pedidos.findOneOrFail({ where: { id } });
    this.realtimeGateway.emitCancelacion({
      pedido_id: id,
      cancelado_por: 'driver',
    });
    return pedido;
  }
}
