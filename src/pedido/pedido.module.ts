import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PedidoController } from './pedido.controller';
import { Pedido } from './pedido.entity';
import { PedidoService } from './pedido.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido]), AuthModule],
  controllers: [PedidoController],
  providers: [PedidoService],
  exports: [TypeOrmModule],
})
export class PedidoModule {}
