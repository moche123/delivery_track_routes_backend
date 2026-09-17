import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { type JwtPayload } from 'src/auth/jwt-auth.guard';
import { Pedido } from './pedido.entity';
import { PedidoService } from './pedido.service';

@Controller('pedido')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  //Curl para probar el endpoint de crear pedido:
  // curl -X POST http://localhost:3000/pedido \
  // -H "Content-Type: application/json" \
  // -H "Authorization: Bearer <ACCESS_TOKEN_DEL_BACKEND>" \
  // -d '{"pedido": {"nombre": "Pedido de prueba", "destino": "Calle Falsa 123", "ubicacion": "Centro"}}'
  @UseGuards(JwtAuthGuard)
  @Post()
  createPedido(
    @CurrentUser() user: JwtPayload,
    @Body('pedido') pedido: Pedido,
  ) {
    return this.pedidoService.createPedido(Number(user.sub), pedido);
  }
}
