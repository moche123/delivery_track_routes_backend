import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Usuario } from './auth/usuario.entity';
import { RefreshToken } from './auth/refresh-token.entity';
import { Pedido } from './pedido/pedido.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? 'mi_usuario',
  password: process.env.DB_PASSWORD ?? 'mi_contraseña',
  database: process.env.DB_NAME ?? 'mi_base_de_datos',
  entities: [Usuario, RefreshToken, Pedido],
  migrations: ['src/migrations/*.ts'],
});
