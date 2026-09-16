import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import type {
  ActualizacionUbicacionPedidoPayload,
  AsignacionPedidoPayload,
} from 'socket_contracts';

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: 'http://localhost:4200', credentials: true },
})
export class RealtimeGateway {
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
