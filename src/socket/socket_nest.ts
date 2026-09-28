import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type {
  ActualizacionUbicacionPedidoPayload,
  AsignacionPedidoPayload,
  CancelacionPedidoPayload,
  PedidoEntregadoPayload,
} from 'socket_contracts';

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:8081'],
    credentials: true,
  },
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  /**
   * Rechaza cualquier conexión de socket que no mande un JWT válido en el
   * handshake (`auth: { token }`), como pide `sockets_nest.md` §7.
   */
  afterInit(server: Server): void {
    server.use((socket, next) => {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        this.logger.warn(`Conexión ${socket.id} rechazada: sin token en el handshake`);
        next(new Error('Unauthorized'));
        return;
      }

      this.jwtService
        .verifyAsync<Record<string, unknown>>(token)
        .then((payload) => {
          const socketData = socket.data as { user: Record<string, unknown> };
          socketData.user = payload;
          next();
        })
        .catch((error) => {
          this.logger.warn(`Conexión ${socket.id} rechazada: token inválido (${error?.message})`);
          next(new Error('Unauthorized'));
        });
    });
  }

  handleConnection(socket: Socket): void {
    const usuario = socket.data as { user?: { sub?: number } };
    this.logger.log(`Socket conectado: ${socket.id} (usuario ${usuario.user?.sub})`);
  }

  emitAsignacion(payload: AsignacionPedidoPayload): void {
    this.server.emit('asignacion_pedido', payload);
  }

  emitCancelacion(payload: CancelacionPedidoPayload): void {
    this.server.emit('cancelacion_pedido', payload);
  }

  emitPedidoEntregado(payload: PedidoEntregadoPayload): void {
    this.server.emit('pedido_entregado', payload);
  }

  /**
   * El rider manda esto directo por socket (no por REST) porque es
   * ubicación en vivo, sin persistir en Postgres — solo se reenvía a todo
   * el resto de conectados (el `client/` mirando el mapa de ese pedido).
   * `driver_id` se pisa con el del JWT ya validado en `afterInit`, nunca se
   * confía en el que mande el cliente en el payload.
   */
  @SubscribeMessage('actualizacion_ubicacion_pedido')
  handleActualizacionUbicacionPedido(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActualizacionUbicacionPedidoPayload,
  ) {
    const usuario = socket.data as { user?: { sub?: number } };
    const driverId = Number(usuario.user?.sub);
    if (!Number.isFinite(driverId)) {
      this.logger.warn(`Ubicación de ${socket.id} ignorada: socket sin usuario autenticado`);
      return;
    }

    this.logger.log(
      `Ubicación recibida de driver ${driverId} para pedido ${payload.pedido_id}: ${payload.lat}, ${payload.lng}`,
    );

    socket.broadcast.emit('actualizacion_ubicacion_pedido', {
      ...payload,
      driver_id: driverId,
    });
  }

  @SubscribeMessage('asignacion_pedido')
  handleAsignacionPedido(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: AsignacionPedidoPayload,
  ) {
    console.log(
      `Asignando el pedido  ${socket.id}: ${payload.driver_id} - ${payload.pedido_id}`,
    );
  }

  @SubscribeMessage('cancelacion_pedido')
  handleCancelacionPedido(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: { pedido_id: number; cancelado_por: 'driver' | 'cliente' },
  ) {
    console.log(
      `Cancelando el pedido  ${socket.id}: ${payload.cancelado_por} - ${payload.pedido_id}`,
    );
  }

  @SubscribeMessage('pedido_entregado')
  handlePedidoEntregado(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { pedido_id: number },
  ) {
    console.log(`Pedido entregado ${socket.id}: ${payload.pedido_id}`);
  }

  @SubscribeMessage('actualizacion_ruta_pedido')
  handleActualizacionRutaPedido(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: { pedido_id: number; new_route: { lat: number; lng: number }[] },
  ) {
    console.log(
      `Actualizando la ruta del pedido  ${socket.id}: ${payload.pedido_id} - ${JSON.stringify(payload.new_route)}`,
    );
  }
}
