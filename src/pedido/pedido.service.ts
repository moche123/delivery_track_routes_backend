import { Injectable } from '@nestjs/common';
import { Pedido } from './pedido.entity';
import { AuthService } from 'src/auth/auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PedidoService {
  constructor(
    private readonly authService: AuthService,
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
}
