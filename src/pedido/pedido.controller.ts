import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { JwtAuthGuard, type JwtPayload } from 'src/auth/jwt-auth.guard';
import { Pedido } from './pedido.entity';
import { PedidoService } from './pedido.service';
import type { ActualizarPedidoDto } from './pedido.service';

@Controller('pedidos')
export class PedidoController {
  constructor(private readonly pedidoService: PedidoService) {}

  //Curl para probar el endpoint de crear pedido:
  // curl -X POST http://localhost:3000/pedidos \
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

  //CURL PARA EL GET de pedidos
  // curl -X GET http://localhost:3000/pedidos \
  // -H "Content-Type: application/json" \
  // -H "Authorization: Bearer <ACCESS_TOKEN_DEL_BACKEND>"

  @UseGuards(JwtAuthGuard)
  @Get()
  getPedidos(@CurrentUser() user: JwtPayload) {
    return this.pedidoService.getPedidos(Number(user.sub));
  }

  //Curl para probar el endpoint de editar pedido:
  // curl -X PATCH http://localhost:3000/pedidos/1 \
  // -H "Content-Type: application/json" \
  // -H "Authorization: Bearer <ACCESS_TOKEN_DEL_BACKEND>" \
  // -d '{"pedido": {"nombre": "Pedido editado", "destino": "150130|-12.1,-77.0|Nuevo lugar"}}'
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updatePedido(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body('pedido') pedido: ActualizarPedidoDto,
  ) {
    return this.pedidoService.updatePedido(Number(user.sub), id, pedido);
  }

  //CURL PARA EL DELETE de pedidos
  // curl -X DELETE http://localhost:3000/pedidos/1 \
  // -H "Authorization: Bearer <ACCESS_TOKEN_DEL_BACKEND>"
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deletePedido(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.pedidoService.deletePedido(Number(user.sub), id);
  }
}
