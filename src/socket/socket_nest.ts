import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import type {
  ActualizacionUbicacionPedidoPayload,
  AsignacionPedidoPayload,
  CancelacionPedidoPayload,
} from 'socket_contracts';

@Injectable()
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: 'http://localhost:4200', credentials: true },
})
export class RealtimeGateway implements OnGatewayInit {
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
        .catch(() => next(new Error('Unauthorized')));
    });
  }

  emitAsignacion(payload: AsignacionPedidoPayload): void {
    this.server.emit('asignacion_pedido', payload);
  }

  emitCancelacion(payload: CancelacionPedidoPayload): void {
    this.server.emit('cancelacion_pedido', payload);
  }

  @SubscribeMessage('actualizacion_ubicacion_pedido')
  handleActualizacionUbicacionPedido(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ActualizacionUbicacionPedidoPayload,
  ) {
    console.log(
      `Actualizando la ubicacion  ${socket.id}: ${payload.driver_id} - ${payload.lat}, ${payload.lng}`,
    );
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
