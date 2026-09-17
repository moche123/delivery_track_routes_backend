import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { RefreshToken } from './auth/refresh-token.entity';
import { Usuario } from './auth/usuario.entity';
import { Pedido } from './pedido/pedido.entity';
import { PedidoModule } from './pedido/pedido.module';
import { RealtimeGateway } from './socket/socket_nest';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'mi_usuario',
      password: process.env.DB_PASSWORD ?? 'mi_contraseña',
      database: process.env.DB_NAME ?? 'mi_base_de_datos',
      entities: [Usuario, RefreshToken, Pedido],
      // Desactivado por defecto para no alterar/borrar datos en cada arranque.
      // Para desarrollo puntual se puede activar con DB_SYNCHRONIZE=true.
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
    }),
    AuthModule,
    PedidoModule,
  ],
  controllers: [AppController],
  providers: [AppService, RealtimeGateway],
})
export class AppModule {}
